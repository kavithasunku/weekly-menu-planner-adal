import { prisma } from "@/lib/prisma";

const DAILY_GENERATION_LIMIT = 3;

/**
 * Check if a user has exceeded their daily menu generation limit.
 * Uses MenuGenerationHistory table (already in schema) as a simple counter.
 */
export async function checkGenerationRateLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetAt: Date;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const tomorrow = new Date(startOfDay);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const used = await prisma.menuGenerationHistory.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  });

  return {
    allowed: used < DAILY_GENERATION_LIMIT,
    used,
    limit: DAILY_GENERATION_LIMIT,
    resetAt: tomorrow,
  };
}

/**
 * Record a successful menu generation for rate limit tracking.
 */
export async function recordGeneration(
  userId: string | null,
  modelUsed: string,
  generationTimeMs: number
): Promise<void> {
  await prisma.menuGenerationHistory.create({
    data: {
      ...(userId ? { userId } : {}),
      modelUsed,
      generationTimeMs,
    },
  });
}
