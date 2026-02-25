import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateMenuSchema = z.object({
  name: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

/**
 * GET /api/menus/[id] - Get a specific saved menu
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const menu = await prisma.savedMenu.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Get Menu Error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

/**
 * PATCH /api/menus/[id] - Update a menu's metadata (name, favorite)
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
    const validatedData = updateMenuSchema.parse(body);

    const menu = await prisma.savedMenu.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.isFavorite !== undefined && { isFavorite: validatedData.isFavorite }),
      },
    });

    return NextResponse.json(menu);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    // Prisma record not found error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    console.error("Update Menu Error:", error);
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
  }
}

/**
 * DELETE /api/menus/[id] - Delete a saved menu
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.savedMenu.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    console.error("Delete Menu Error:", error);
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}
