import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const swapMealSchema = z.object({
  source: z.object({
    day: z.string(),
    mealType: z.string(),
  }),
  destination: z.object({
    day: z.string(),
    mealType: z.string(),
  }),
});

/**
 * PATCH /api/menus/[id]/swap - Swap two meals or move a meal
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { source, destination } = swapMealSchema.parse(body);

    // Fetch the menu ensuring it belongs to the user
    const menu = await prisma.savedMenu.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Deep clone the generated menu to safely mutate it
    const generatedMenu: any = typeof menu.generatedMenu === 'string' 
      ? JSON.parse(menu.generatedMenu) 
      : JSON.parse(JSON.stringify(menu.generatedMenu));

    if (!generatedMenu.weeklyMenu || !Array.isArray(generatedMenu.weeklyMenu)) {
      return NextResponse.json({ error: "Invalid menu format" }, { status: 400 });
    }

    // Find the indices for the source and destination days
    const sourceDayIndex = generatedMenu.weeklyMenu.findIndex((d: any) => d.day === source.day);
    const destDayIndex = generatedMenu.weeklyMenu.findIndex((d: any) => d.day === destination.day);

    if (sourceDayIndex === -1 || destDayIndex === -1) {
      return NextResponse.json({ error: "Invalid source or destination day" }, { status: 400 });
    }

    // Get the meals objects (default to empty object if undefined)
    const sourceMeals = generatedMenu.weeklyMenu[sourceDayIndex].meals || {};
    const destMeals = generatedMenu.weeklyMenu[destDayIndex].meals || {};

    // Get the individual meals
    const sourceMeal = sourceMeals[source.mealType];
    const destMeal = destMeals[destination.mealType];

    // Perform the swap
    if (sourceMeal) {
      destMeals[destination.mealType] = sourceMeal;
    } else {
      delete destMeals[destination.mealType];
    }

    if (destMeal) {
      sourceMeals[source.mealType] = destMeal;
    } else {
      delete sourceMeals[source.mealType];
    }

    // Apply back to the weeklyMenu
    generatedMenu.weeklyMenu[sourceDayIndex].meals = sourceMeals;
    generatedMenu.weeklyMenu[destDayIndex].meals = destMeals;

    // Save the updated menu back to the database
    const updatedMenu = await prisma.savedMenu.update({
      where: { id },
      data: { generatedMenu },
    });

    return NextResponse.json(updatedMenu);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Swap Meal Error:", error);
    return NextResponse.json({ error: "Failed to swap meals" }, { status: 500 });
  }
}
