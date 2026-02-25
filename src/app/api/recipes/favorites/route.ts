import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const saveFavoriteSchema = z.object({
  recipeName: z.string().min(1),
  recipeData: z.any(),
  sourceMenuId: z.string().optional().nullable(),
  sourceDay: z.string().optional().nullable(),
  sourceMealType: z.string().optional().nullable(),
});

/**
 * GET /api/recipes/favorites - List all favorite recipes for the current user
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const favorites = await prisma.favoriteRecipe.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Fetch Favorites Error:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

/**
 * POST /api/recipes/favorites - Save a recipe to favorites
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = saveFavoriteSchema.parse(body);

    const favorite = await prisma.favoriteRecipe.create({
      data: {
        userId: session.user.id,
        recipeName: data.recipeName,
        recipeData: data.recipeData,
        sourceMenuId: data.sourceMenuId ?? null,
        sourceDay: data.sourceDay ?? null,
        sourceMealType: data.sourceMealType ?? null,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Save Favorite Error:", error);
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 });
  }
}
