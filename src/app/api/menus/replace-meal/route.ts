import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildMealReplacementPrompt } from "@/lib/prompts/menu-generation";
import { checkGenerationRateLimit, recordGeneration, GUEST_FREE_LIMIT } from "@/lib/rate-limit";

export const maxDuration = 30;

const GUEST_GENERATION_COOKIE = "free_gen_count";

const requestSchema = z.object({
  mealType: z.string(),
  isBusyDay: z.boolean(),
  cuisines: z.array(z.string()),
  diets: z.array(z.string()),
  cookingTime: z.number(),
  notes: z.string(),
  excludeNames: z.array(z.string()),
});

const mealSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  caloriesPerServing: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  ingredients: z.array(z.object({ amount: z.string(), item: z.string() })),
  steps: z.array(z.string()),
});

export async function POST(req: Request) {
  const session = await auth();
  const cookieStore = await cookies();

  let params: z.infer<typeof requestSchema>;
  try {
    params = requestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mealType, isBusyDay, cookingTime, excludeNames } = params;

  // ── 1. Favorites-first: free, instant, zero AI cost ───────────────────────
  if (session?.user?.id) {
    const favorites = await prisma.favoriteRecipe.findMany({
      where: { userId: session.user.id, sourceMealType: mealType },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const maxMinutes = isBusyDay ? 15 : cookingTime;
    const candidates = favorites.filter((fav) => {
      const recipe = fav.recipeData as Record<string, unknown> | null;
      if (!recipe || typeof recipe.name !== "string" || excludeNames.includes(recipe.name)) return false;
      const prepTime = typeof recipe.prepTime === "number" ? recipe.prepTime : 0;
      const cookTime = typeof recipe.cookTime === "number" ? recipe.cookTime : 0;
      return prepTime + cookTime <= maxMinutes;
    });

    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const { mealType, ...meal } = pick.recipeData as Record<string, unknown>;
      void mealType;
      return Response.json({ meal, source: "favorite" });
    }
  }

  // ── 2. No favorite match: fall back to a metered AI call ───────────────────
  if (session?.user?.id) {
    const rateLimit = await checkGenerationRateLimit(session.user.id, session.user.email);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: "Free limit reached",
          type: "rate_limit",
          message: `You've used all ${rateLimit.limit} free menu generations. Upgrade to keep planning — coming soon!`,
          used: rateLimit.used,
          limit: rateLimit.limit,
        },
        { status: 429 }
      );
    }

    const result = await generateReplacement(params);
    if (result.error) return result.response;

    await recordGeneration(session.user.id, "gpt-4o", result.timeMs);
    return Response.json({
      meal: result.meal,
      source: "ai",
      _meta: { used: rateLimit.used + 1, limit: rateLimit.limit },
    });
  }

  // ── Guest: same lifetime limit as signed-in users, no sign-in required ────
  const guestUsed = parseInt(cookieStore.get(GUEST_GENERATION_COOKIE)?.value || "0", 10) || 0;
  if (guestUsed >= GUEST_FREE_LIMIT) {
    return Response.json(
      {
        error: "Free limit reached",
        type: "rate_limit",
        message: `You've used all ${GUEST_FREE_LIMIT} free menu generations. Upgrade to keep planning — coming soon!`,
        used: guestUsed,
        limit: GUEST_FREE_LIMIT,
      },
      { status: 429 }
    );
  }

  const result = await generateReplacement(params);
  if (result.error) return result.response;

  await recordGeneration(null, "gpt-4o", result.timeMs);

  const newGuestUsed = guestUsed + 1;
  cookieStore.set(GUEST_GENERATION_COOKIE, String(newGuestUsed), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return Response.json({
    meal: result.meal,
    source: "ai",
    _meta: { used: newGuestUsed, limit: GUEST_FREE_LIMIT },
  });
}

// ── Shared single-meal generation logic ─────────────────────────────────────
async function generateReplacement(params: z.infer<typeof requestSchema>): Promise<
  | { error: false; meal: object; timeMs: number; response?: never }
  | { error: true; response: Response; meal?: never; timeMs?: never }
> {
  const startTime = Date.now();
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: mealSchema,
      prompt: buildMealReplacementPrompt(params),
    });

    const { type, ...meal } = result.object;
    void type;
    return { error: false, meal, timeMs: Date.now() - startTime };
  } catch (error: unknown) {
    console.error("AI Meal Replacement Error:", error);
    return {
      error: true,
      response: Response.json({ error: "Failed to generate a replacement meal" }, { status: 500 }),
    };
  }
}
