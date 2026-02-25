import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { buildMenuGenerationPrompt } from "@/lib/prompts/menu-generation";
import { checkGenerationRateLimit, recordGeneration } from "@/lib/rate-limit";

export const maxDuration = 30;

const FREE_GUEST_COOKIE = "free_gen_used";

export async function POST(req: Request) {
  const session = await auth();
  const cookieStore = await cookies();

  // ── Authenticated user: DB-based rate limit ───────────────────────────────
  if (session?.user?.id) {
    const rateLimit = await checkGenerationRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: "Daily limit reached",
          type: "rate_limit",
          message: `You've used all ${rateLimit.limit} menu generations for today. Resets at midnight.`,
          used: rateLimit.used,
          limit: rateLimit.limit,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    const result = await generate(req);
    if (result.error) return result.response;

    await recordGeneration(session.user.id, "gpt-4o", result.timeMs);

    return Response.json({
      ...result.menu,
      _meta: { used: rateLimit.used + 1, limit: rateLimit.limit },
    });
  }

  // ── Guest user: unlimited for now (hackathon demo) ───────────────────────
  const result = await generate(req);
  if (result.error) return result.response;

  await recordGeneration(null, "gpt-4o", result.timeMs);

  return Response.json({
    ...result.menu,
    _meta: { guest: true },
  });
}

// ── Shared generation logic ────────────────────────────────────────────────
async function generate(req: Request): Promise<
  | { error: false; menu: object; timeMs: number; response?: never }
  | { error: true; response: Response; menu?: never; timeMs?: never }
> {
  const startTime = Date.now();
  try {
    const formData = await req.json();

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        weeklyMenu: z.array(
          z.object({
            day: z.string(),
            meals: z.array(
              z.object({
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
              })
            ),
          })
        ),
        groceryList: z.array(
          z.object({
            category: z.string(),
            items: z.array(z.object({ amount: z.string(), item: z.string() })),
          })
        ),
      }),
      prompt: buildMenuGenerationPrompt(formData),
    });

    const menu = {
      ...result.object,
      weeklyMenu: result.object.weeklyMenu.map((day) => ({
        day: day.day,
        meals: day.meals.reduce((acc: any, meal) => {
          acc[meal.type] = {
            name: meal.name,
            description: meal.description,
            prepTime: meal.prepTime,
            cookTime: meal.cookTime,
            caloriesPerServing: meal.caloriesPerServing,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            ingredients: meal.ingredients,
            steps: meal.steps,
          };
          return acc;
        }, {}),
      })),
    };

    return { error: false, menu, timeMs: Date.now() - startTime };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      error: true,
      response: Response.json(
        {
          error: "Failed to generate menu",
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
            stack: error.stack,
          }),
        },
        { status: 500 }
      ),
    };
  }
}
