import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_CANDIDATES,
  isEligibleCandidate,
  normalizeMeal,
  shuffle,
  type CandidateContext,
  type RawMeal,
} from "@/lib/meal-candidates";

const requestSchema = z.object({
  mealType: z.string(),
  isBusyDay: z.boolean(),
  diets: z.array(z.string()),
  cookingTime: z.number(),
  excludeNames: z.array(z.string()),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: "Sign in to fetch replacements from your favorites" },
      { status: 401 }
    );
  }

  let params: z.infer<typeof requestSchema>;
  try {
    params = requestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mealType } = params;
  const context: CandidateContext = {
    isBusyDay: params.isBusyDay,
    diets: params.diets,
    cookingTime: params.cookingTime,
    excludeNames: params.excludeNames,
  };

  const favorites = await prisma.favoriteRecipe.findMany({
    where: { userId: session.user.id, sourceMealType: mealType },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const meals: RawMeal[] = [];
  for (const fav of favorites) {
    const meal = normalizeMeal(fav.recipeData);
    if (meal && isEligibleCandidate(meal, fav.diets, context)) meals.push(meal);
  }

  return Response.json({ candidates: shuffle(meals).slice(0, MAX_CANDIDATES) });
}
