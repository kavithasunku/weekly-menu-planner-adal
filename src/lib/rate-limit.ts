import { prisma } from "@/lib/prisma";

const LIFETIME_FREE_LIMIT = 7;
export const GUEST_FREE_LIMIT = LIFETIME_FREE_LIMIT;

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/**
 * Check if a user has exceeded their lifetime free menu generation limit.
 * Admins (see ADMIN_EMAILS) always bypass the limit.
 * Uses MenuGenerationHistory table (already in schema) as a simple counter.
 */
export async function checkGenerationRateLimit(
  userId: string,
  email?: string | null
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  isAdmin: boolean;
}> {
  const used = await prisma.menuGenerationHistory.count({
    where: { userId },
  });

  if (isAdminEmail(email)) {
    return { allowed: true, used, limit: LIFETIME_FREE_LIMIT, isAdmin: true };
  }

  return {
    allowed: used < LIFETIME_FREE_LIMIT,
    used,
    limit: LIFETIME_FREE_LIMIT,
    isAdmin: false,
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
