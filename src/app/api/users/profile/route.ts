import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileUpdateSchema = z.object({
  // Profile fields
  name: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  location: z.string().optional(),
  defaultAdults: z.number().min(1).optional(),
  defaultKids: z.number().min(0).optional(),
  defaultMeals: z.array(z.string()).optional(),
  defaultCuisines: z.array(z.string()).optional(),
  defaultDiet: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  
  // UserPreference fields
  busyDays: z.array(z.string()).optional(),
  cookingTime: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine for a cleaner frontend response
    return NextResponse.json({
      profile: user.profile,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    const {
      busyDays,
      cookingTime,
      notes,
      ...profileData
    } = validatedData;

    // Use a transaction to update both related models
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
        preferences: {
          upsert: {
            create: {
              busyDays: busyDays ?? [],
              cookingTime: cookingTime ?? 30,
              notes: notes ?? "",
            },
            update: {
              ...(busyDays !== undefined && { busyDays }),
              ...(cookingTime !== undefined && { cookingTime }),
              ...(notes !== undefined && { notes }),
            },
          },
        },
      },
      include: {
        profile: true,
        preferences: true,
      },
    });

    return NextResponse.json({
      profile: updatedUser.profile,
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
