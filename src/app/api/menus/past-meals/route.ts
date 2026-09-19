import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_CANDIDATES,
  isEligibleCandidate,
  normalizeMeal,
  shuffle,
  dietsFromPlannerState,
  type CandidateContext,
  type RawMeal,
} from "@/lib/meal-candidates";

/** How many recent saved menus to scan. Deep history adds little and costs rows. */
const MENU_SCAN_LIMIT = 25;

const requestSchema = z.object({
  mealType: z.string(),
  isBusyDay: z.boolean(),
  diets: z.array(z.string()),
  cookingTime: z.number(),
  excludeNames: z.array(z.string()),
  /** The menu currently open, if it's already saved — don't offer its own meals back. */
  excludeMenuId: z.string().nullable().optional(),
});

interface SavedMenuShape {
  weeklyMenu?: { day?: unknown; meals?: unknown }[];
}

/**
 * POST /api/menus/past-meals - Replacement candidates drawn from the meals in
 * the user's previously saved menus. Deterministic: no AI call.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "Sign in to pull meals from your saved menus" },
      { status: 401 }
    );
  }

  let params: z.infer<typeof requestSchema>;
  try {
    params = requestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mealType, excludeMenuId } = params;
  const context: CandidateContext = {
    isBusyDay: params.isBusyDay,
    diets: params.diets,
    cookingTime: params.cookingTime,
    excludeNames: params.excludeNames,
  };

  const menus = await prisma.savedMenu.findMany({
    where: {
      userId: session.user.id,
      ...(excludeMenuId ? { id: { not: excludeMenuId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: MENU_SCAN_LIMIT,
    select: { id: true, name: true, plannerState: true, generatedMenu: true },
  });

  const wantedMealType = mealType.toLowerCase();
  const seenNames = new Set(context.excludeNames);
  const candidates: {
    meal: RawMeal;
    sourceMenuId: string;
    sourceMenuName: string;
    sourceDay: string;
  }[] = [];

  for (const menu of menus) {
    const menuDiets = dietsFromPlannerState(menu.plannerState);
    const generated = menu.generatedMenu as SavedMenuShape | null;
    if (!generated?.weeklyMenu || !Array.isArray(generated.weeklyMenu)) continue;

    for (const dayEntry of generated.weeklyMenu) {
      const meals = dayEntry?.meals;
      if (!meals || typeof meals !== "object" || Array.isArray(meals)) continue;

      for (const [mealKey, rawMeal] of Object.entries(meals as Record<string, unknown>)) {
        // Menus key meals by title-cased type ("Dinner"); the modal passes lowercase.
        if (mealKey.toLowerCase() !== wantedMealType) continue;

        const meal = normalizeMeal(rawMeal);
        if (!meal) continue;
        // De-dupe across menus: the same dish often recurs week to week.
        if (seenNames.has(meal.name)) continue;
        if (!isEligibleCandidate(meal, menuDiets, context)) continue;

        seenNames.add(meal.name);
        candidates.push({
          meal,
          sourceMenuId: menu.id,
          sourceMenuName: menu.name,
          sourceDay: typeof dayEntry.day === "string" ? dayEntry.day : "",
        });
      }
    }
  }

  return Response.json({ candidates: shuffle(candidates).slice(0, MAX_CANDIDATES) });
}
