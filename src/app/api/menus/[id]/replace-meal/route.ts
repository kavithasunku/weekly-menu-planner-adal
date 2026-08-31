import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const MAX_JSON_SIZE = 500 * 1024; // 500 KB

const replaceMealSchema = z.object({
  day: z.string(),
  mealType: z.string(),
  meal: z.record(z.string(), z.any()).refine(
    (v) => JSON.stringify(v).length <= MAX_JSON_SIZE,
    { message: "meal exceeds maximum allowed size" }
  ),
});

interface WeeklyMenuDay {
  day: string;
  meals: Record<string, unknown>;
}

interface GeneratedMenuShape {
  weeklyMenu: WeeklyMenuDay[];
  [key: string]: unknown;
}

/**
 * PATCH /api/menus/[id]/replace-meal - Persist a confirmed meal replacement
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
    const { day, mealType, meal } = replaceMealSchema.parse(body);

    const menu = await prisma.savedMenu.findUnique({
      where: { id, userId: session.user.id },
    });
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const generatedMenu: GeneratedMenuShape = typeof menu.generatedMenu === "string"
      ? JSON.parse(menu.generatedMenu)
      : JSON.parse(JSON.stringify(menu.generatedMenu));

    if (!generatedMenu.weeklyMenu || !Array.isArray(generatedMenu.weeklyMenu)) {
      return NextResponse.json({ error: "Invalid menu format" }, { status: 400 });
    }

    const dayIndex = generatedMenu.weeklyMenu.findIndex((d) => d.day === day);
    if (dayIndex === -1) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    generatedMenu.weeklyMenu[dayIndex].meals = {
      ...generatedMenu.weeklyMenu[dayIndex].meals,
      [mealType]: meal,
    };

    const updatedMenu = await prisma.savedMenu.update({
      where: { id },
      data: { generatedMenu: generatedMenu as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(updatedMenu);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Replace Meal Error:", error);
    return NextResponse.json({ error: "Failed to save the replacement meal" }, { status: 500 });
  }
}
