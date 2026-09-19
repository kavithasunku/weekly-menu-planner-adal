import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { savedMenu: { findMany: vi.fn() } },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "../route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.savedMenu.findMany as unknown as ReturnType<typeof vi.fn>;

const dinner = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  description: `${name} description`,
  prepTime: 10,
  cookTime: 10,
  caloriesPerServing: 400,
  protein: 20,
  carbs: 30,
  fat: 10,
  ingredients: [{ amount: "1", item: "thing" }],
  steps: ["Cook it"],
  ...over,
});

const savedMenu = (
  id: string,
  name: string,
  meals: Record<string, unknown>[],
  plannerState: Record<string, unknown> = {}
) => ({
  id,
  name,
  plannerState,
  generatedMenu: {
    weeklyMenu: meals.map((meal, i) => ({
      day: ["Monday", "Tuesday", "Wednesday"][i] ?? `Day ${i}`,
      meals: { Dinner: meal },
    })),
  },
});

const body = (over: Record<string, unknown> = {}) => ({
  mealType: "dinner",
  isBusyDay: false,
  diets: [],
  cookingTime: 30,
  excludeNames: [],
  ...over,
});

const post = (payload: unknown) =>
  POST(new Request("http://localhost/api/menus/past-meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));

describe("POST /api/menus/past-meals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindMany.mockResolvedValue([]);
  });

  it("requires a signed-in user", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await post(body());
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload", async () => {
    const res = await post({ mealType: "dinner" });
    expect(res.status).toBe(400);
  });

  it("returns matching meals with their source menu and day", async () => {
    mockFindMany.mockResolvedValue([savedMenu("m1", "Week of Sep 8", [dinner("Rajma Chawal")])]);

    const res = await post(body());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.candidates).toHaveLength(1);
    expect(data.candidates[0]).toMatchObject({
      sourceMenuId: "m1",
      sourceMenuName: "Week of Sep 8",
      sourceDay: "Monday",
    });
    expect(data.candidates[0].meal.name).toBe("Rajma Chawal");
  });

  it("excludes the menu currently being edited", async () => {
    await post(body({ excludeMenuId: "current-menu" }));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", id: { not: "current-menu" } }),
      })
    );
  });

  it("does not filter by menu id when the menu is unsaved", async () => {
    await post(body({ excludeMenuId: null }));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("only returns meals of the requested type, matching title-cased keys", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "m1",
        name: "Week 1",
        plannerState: {},
        generatedMenu: {
          weeklyMenu: [
            { day: "Monday", meals: { Breakfast: dinner("Poha"), Dinner: dinner("Rajma Chawal") } },
          ],
        },
      },
    ]);

    const data = await (await post(body({ mealType: "dinner" }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Rajma Chawal"]);
  });

  it("de-dupes a dish that recurs across menus, keeping the most recent menu", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu("m2", "Week of Sep 15", [dinner("Rajma Chawal")]),
      savedMenu("m1", "Week of Sep 8", [dinner("Rajma Chawal")]),
    ]);

    const data = await (await post(body())).json();
    expect(data.candidates).toHaveLength(1);
    expect(data.candidates[0].sourceMenuId).toBe("m2");
  });

  it("drops meals already on the current menu", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu("m1", "Week 1", [dinner("Rajma Chawal"), dinner("Palak Paneer")]),
    ]);

    const data = await (await post(body({ excludeNames: ["Rajma Chawal"] }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Palak Paneer"]);
  });

  it("drops meals over the time budget for a busy day", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu("m1", "Week 1", [
        dinner("Slow Dal", { prepTime: 10, cookTime: 30 }),
        dinner("Quick Chaat", { prepTime: 5, cookTime: 5 }),
      ]),
    ]);

    const data = await (await post(body({ isBusyDay: true }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Quick Chaat"]);
  });

  it("offers meals from menus of a different cuisine", async () => {
    // The whole point: an Italian dish must stay reachable during an Indian week.
    mockFindMany.mockResolvedValue([
      savedMenu("m1", "Italian week", [dinner("Pasta Primavera")], { cuisines: ["italian"] }),
      savedMenu("m2", "Indian week", [dinner("Palak Paneer")], { cuisines: ["north-indian"] }),
    ]);

    const data = await (await post(body())).json();
    expect(
      data.candidates.map((c: { meal: { name: string } }) => c.meal.name).sort()
    ).toEqual(["Palak Paneer", "Pasta Primavera"]);
  });

  it("filters by the source menu's diet selections", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu("m1", "Keto week", [dinner("Butter Chicken")], { diets: ["keto"] }),
      savedMenu("m2", "Veg week", [dinner("Palak Paneer")], { diets: ["vegetarian"] }),
    ]);

    const data = await (await post(body({ diets: ["vegetarian"] }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Palak Paneer"]);
  });

  it("still offers menus saved before diets were recorded", async () => {
    mockFindMany.mockResolvedValue([savedMenu("legacy", "Old week", [dinner("Rajma Chawal")], {})]);

    const data = await (await post(body({ diets: ["vegetarian"] }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Rajma Chawal"]);
  });

  it("keeps a menu that overlaps on only one of several selected diets", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu("m1", "Veg week", [dinner("Palak Paneer")], { diets: ["vegetarian"] }),
      savedMenu("m2", "Keto week", [dinner("Butter Chicken")], { diets: ["keto"] }),
    ]);

    const data = await (await post(body({ diets: ["vegetarian", "gluten-free"] }))).json();
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Palak Paneer"]);
  });

  it("skips menus whose stored JSON is malformed instead of failing the request", async () => {
    mockFindMany.mockResolvedValue([
      { id: "bad", name: "Broken", plannerState: {}, generatedMenu: { weeklyMenu: "nope" } },
      { id: "null", name: "Empty", plannerState: {}, generatedMenu: null },
      savedMenu("good", "Week 1", [dinner("Rajma Chawal")]),
    ]);

    const res = await post(body());
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.candidates.map((c: { meal: { name: string } }) => c.meal.name)).toEqual(["Rajma Chawal"]);
  });

  it("caps the number of candidates returned", async () => {
    mockFindMany.mockResolvedValue([
      savedMenu(
        "m1",
        "Big week",
        Array.from({ length: 20 }, (_, i) => dinner(`Meal ${i}`))
      ),
    ]);

    const data = await (await post(body())).json();
    expect(data.candidates).toHaveLength(8);
  });
});
