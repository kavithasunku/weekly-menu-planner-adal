import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    menuGenerationHistory: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { checkGenerationRateLimit, GUEST_FREE_LIMIT } from "@/lib/rate-limit";

const mockCount = prisma.menuGenerationHistory.count as unknown as ReturnType<typeof vi.fn>;

describe("checkGenerationRateLimit", () => {
  beforeEach(() => {
    mockCount.mockReset();
    delete process.env.ADMIN_EMAILS;
  });

  it("allows a non-admin user under the lifetime limit", async () => {
    mockCount.mockResolvedValue(6);
    const result = await checkGenerationRateLimit("user-1", "someone@example.com");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(6);
    expect(result.limit).toBe(GUEST_FREE_LIMIT);
    expect(result.isAdmin).toBe(false);
  });

  it("blocks a non-admin user at or above the lifetime limit", async () => {
    mockCount.mockResolvedValue(7);
    const result = await checkGenerationRateLimit("user-1", "someone@example.com");
    expect(result.allowed).toBe(false);

    mockCount.mockResolvedValue(99);
    const overResult = await checkGenerationRateLimit("user-1", "someone@example.com");
    expect(overResult.allowed).toBe(false);
  });

  it("always allows an admin email regardless of usage", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    mockCount.mockResolvedValue(999);
    const result = await checkGenerationRateLimit("admin-user", "admin@example.com");
    expect(result.allowed).toBe(true);
    expect(result.isAdmin).toBe(true);
  });

  it("matches admin emails case-insensitively and ignores surrounding whitespace", async () => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , other@example.com ";
    mockCount.mockResolvedValue(999);
    const result = await checkGenerationRateLimit("admin-user", "admin@example.com");
    expect(result.allowed).toBe(true);
    expect(result.isAdmin).toBe(true);
  });

  it("does not bypass for a non-matching or missing email", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    mockCount.mockResolvedValue(7);

    const nonMatching = await checkGenerationRateLimit("user-1", "not-admin@example.com");
    expect(nonMatching.allowed).toBe(false);
    expect(nonMatching.isAdmin).toBe(false);

    const missingEmail = await checkGenerationRateLimit("user-1", null);
    expect(missingEmail.allowed).toBe(false);
    expect(missingEmail.isAdmin).toBe(false);
  });
});
