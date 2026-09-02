import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  mealType: z.string(),
  isBusyDay: z.boolean(),
  cuisines: z.array(z.string()),
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
  const { mealType, isBusyDay, cuisines, diets, cookingTime, excludeNames } = params;

  const favorites = await prisma.favoriteRecipe.findMany({
    where: { userId: session.user.id, sourceMealType: mealType },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const maxMinutes = isBusyDay ? 15 : cookingTime;
  const candidates = favorites.filter((fav) => {
    const recipe = fav.recipeData as Record<string, unknown> | null;
    if (!recipe || typeof recipe.name !== "string" || excludeNames.includes(recipe.name)) return false;

    const prepTime = typeof recipe.prepTime === "number" ? recipe.prepTime : 0;
    const cookTime = typeof recipe.cookTime === "number" ? recipe.cookTime : 0;
    if (prepTime + cookTime > maxMinutes) return false;

    // Cuisine: if the planner has cuisine preferences, the favorite must match at
    // least one of them (favorites saved before this field existed have none tagged
    // and are treated as unrestricted).
    if (cuisines.length > 0 && fav.cuisines.length > 0) {
      if (!fav.cuisines.some((c) => cuisines.includes(c))) return false;
    }

    // Diet: the favorite must satisfy every diet currently selected.
    if (diets.length > 0) {
      if (!diets.every((d) => fav.diets.includes(d))) return false;
    }

    return true;
  });

  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 8);
  const meals = shuffled.map((fav) => {
    const { mealType, ...meal } = fav.recipeData as Record<string, unknown>;
    void mealType;
    return meal;
  });

  return Response.json({ candidates: meals });
}
