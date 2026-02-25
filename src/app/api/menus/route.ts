import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for saving a menu
const saveMenuSchema = z.object({
  name: z.string().min(1),
  plannerState: z.any(),
  generatedMenu: z.any(),
  weekStartDate: z.string().optional(),
  weekEndDate: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

/**
 * GET /api/menus - List user's saved menus
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const menus = await prisma.savedMenu.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        isFavorite: true,
        createdAt: true,
        weekStartDate: true,
        weekEndDate: true,
      },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Fetch Menus Error:", error);
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
  }
}

/**
 * POST /api/menus - Save a new menu
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const validatedData = saveMenuSchema.parse(body);

    type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
    const menu = await prisma.$transaction(async (tx: TxClient) => {
      // 1. Save the menu
      const savedMenu = await tx.savedMenu.create({
        data: {
          userId,
          name: validatedData.name,
          plannerState: validatedData.plannerState,
          generatedMenu: validatedData.generatedMenu,
          weekStartDate: validatedData.weekStartDate ? new Date(validatedData.weekStartDate) : null,
          weekEndDate: validatedData.weekEndDate ? new Date(validatedData.weekEndDate) : null,
          isFavorite: validatedData.isFavorite || false,
        },
      });

      // 2. Create the associated grocery list automatically
      if (validatedData.generatedMenu?.groceryList) {
        await tx.groceryList.create({
          data: {
            userId,
            savedMenuId: savedMenu.id,
            items: validatedData.generatedMenu.groceryList,
          },
        });
      }

      return savedMenu;
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Save Menu Error:", error);
    return NextResponse.json({ error: "Failed to save menu" }, { status: 500 });
  }
}
