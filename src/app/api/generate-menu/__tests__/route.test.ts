import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkGenerationRateLimit: vi.fn(),
    recordGeneration: vi.fn(),
  };
});

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { checkGenerationRateLimit, GUEST_FREE_LIMIT } from "@/lib/rate-limit";
import { generateObject } from "ai";
import { POST } from "../route";

const mockCookies = cookies as unknown as ReturnType<typeof vi.fn>;
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCheckRateLimit = checkGenerationRateLimit as unknown as ReturnType<typeof vi.fn>;
const mockGenerateObject = generateObject as unknown as ReturnType<typeof vi.fn>;

const SAMPLE_MENU_OBJECT = {
  weeklyMenu: [
    {
      day: "Monday",
      meals: [
        {
          type: "dinner",
          name: "Test Meal",
          description: "A test meal",
          prepTime: 5,
          cookTime: 10,
          caloriesPerServing: 400,
          protein: 20,
          carbs: 30,
          fat: 10,
          ingredients: [{ amount: "1", item: "test ingredient" }],
          steps: ["Do the thing"],
        },
      ],
    },
  ],
  groceryList: [{ category: "Test", items: [{ amount: "1", item: "test ingredient" }] }],
};

function makeRequest() {
  return new Request("http://localhost/api/generate-menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adults: 2,
      kids: 0,
      kidsAges: [],
      meals: ["dinner"],
      cuisines: ["italian"],
      diets: ["none"],
      busyDays: [],
      cookingTime: 30,
      notes: "",
    }),
  });
}

function makeCookieStore(initialValue?: string) {
  const set = vi.fn();
  const get = vi.fn().mockReturnValue(initialValue === undefined ? undefined : { value: initialValue });
  return { get, set };
}

describe("POST /api/generate-menu", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockCookies.mockReset();
    mockCheckRateLimit.mockReset();
    mockGenerateObject.mockReset();
    mockGenerateObject.mockResolvedValue({ object: SAMPLE_MENU_OBJECT });
  });

  describe("guest (unauthenticated)", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("with no cookie: succeeds and sets the count to 1", async () => {
      const store = makeCookieStore(undefined);
      mockCookies.mockResolvedValue(store);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data._meta).toEqual({ guest: true, used: 1, limit: GUEST_FREE_LIMIT });
      expect(store.set).toHaveBeenCalledWith("free_gen_count", "1", expect.any(Object));
    });

    it("at count 5: succeeds and becomes 6", async () => {
      const store = makeCookieStore("5");
      mockCookies.mockResolvedValue(store);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data._meta.used).toBe(6);
      expect(store.set).toHaveBeenCalledWith("free_gen_count", "6", expect.any(Object));
    });

    it("at count 6: succeeds and becomes 7 (the last free one)", async () => {
      const store = makeCookieStore("6");
      mockCookies.mockResolvedValue(store);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data._meta.used).toBe(7);
      expect(store.set).toHaveBeenCalledWith("free_gen_count", "7", expect.any(Object));
    });

    it("at or above the limit: is blocked with 429 and never calls the AI", async () => {
      for (const startingCount of ["7", "99"]) {
        mockGenerateObject.mockClear();
        const store = makeCookieStore(startingCount);
        mockCookies.mockResolvedValue(store);

        const res = await POST(makeRequest());
        expect(res.status).toBe(429);
        const data = await res.json();
        expect(data.type).toBe("rate_limit");
        expect(mockGenerateObject).not.toHaveBeenCalled();
        expect(store.set).not.toHaveBeenCalled();
      }
    });
  });

  describe("authenticated", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", email: "someone@example.com" } });
      mockCookies.mockResolvedValue(makeCookieStore(undefined));
    });

    it("non-admin at the lifetime limit: is blocked with 429 and never calls the AI", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false, used: 7, limit: 7, isAdmin: false });

      const res = await POST(makeRequest());
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.type).toBe("rate_limit");
      expect(mockGenerateObject).not.toHaveBeenCalled();
    });

    it("admin user: always succeeds regardless of usage count", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: true, used: 999, limit: 7, isAdmin: true });

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    });
  });
});
