import { describe, it, expect } from "vitest";
import {
  BUSY_DAY_MAX_MINUTES,
  isEligibleCandidate,
  maxMinutesFor,
  normalizeMeal,
  shuffle,
  dietsFromPlannerState,
  type CandidateContext,
} from "@/lib/meal-candidates";

const meal = (over: Record<string, unknown> = {}) => ({
  name: "Paneer Tikka",
  description: "Grilled paneer",
  prepTime: 10,
  cookTime: 10,
  ...over,
});

const context = (over: Partial<CandidateContext> = {}): CandidateContext => ({
  diets: [],
  cookingTime: 30,
  isBusyDay: false,
  excludeNames: [],
  ...over,
});

const NO_DIETS: string[] = [];

describe("maxMinutesFor", () => {
  it("uses the cooking-time budget on a normal day", () => {
    expect(maxMinutesFor({ isBusyDay: false, cookingTime: 45 })).toBe(45);
  });

  it("clamps to the busy-day budget regardless of the global setting", () => {
    expect(maxMinutesFor({ isBusyDay: true, cookingTime: 45 })).toBe(BUSY_DAY_MAX_MINUTES);
  });
});

describe("normalizeMeal", () => {
  it("strips mealType so it can't leak into the saved menu", () => {
    const result = normalizeMeal({ ...meal(), mealType: "dinner" });
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("mealType");
    expect(result!.name).toBe("Paneer Tikka");
  });

  it("rejects blobs without a usable name", () => {
    expect(normalizeMeal(null)).toBeNull();
    expect(normalizeMeal("Paneer Tikka")).toBeNull();
    expect(normalizeMeal([meal()])).toBeNull();
    expect(normalizeMeal({ description: "no name" })).toBeNull();
    expect(normalizeMeal({ name: "   " })).toBeNull();
  });
});

describe("isEligibleCandidate", () => {
  it("accepts a meal within budget with no restrictions", () => {
    expect(isEligibleCandidate(meal(), NO_DIETS, context())).toBe(true);
  });

  it("rejects meals already on the menu", () => {
    expect(
      isEligibleCandidate(meal(), NO_DIETS, context({ excludeNames: ["Paneer Tikka"] }))
    ).toBe(false);
  });

  it("rejects meals over the cooking-time budget", () => {
    expect(
      isEligibleCandidate(meal({ prepTime: 20, cookTime: 20 }), NO_DIETS, context({ cookingTime: 30 }))
    ).toBe(false);
  });

  it("applies the tighter busy-day budget", () => {
    const m = meal({ prepTime: 10, cookTime: 10 }); // 20 min: fine normally, too slow when busy
    expect(isEligibleCandidate(m, NO_DIETS, context())).toBe(true);
    expect(isEligibleCandidate(m, NO_DIETS, context({ isBusyDay: true }))).toBe(false);
  });

  it("treats a missing prepTime/cookTime as zero rather than excluding", () => {
    expect(
      isEligibleCandidate(meal({ prepTime: undefined, cookTime: undefined }), NO_DIETS, context())
    ).toBe(true);
  });

  it("ignores cuisine entirely — an off-cuisine dish is a valid pick", () => {
    // Cuisine is not an input to eligibility at all; a meal carrying a stray
    // cuisine field must not influence the outcome.
    expect(isEligibleCandidate(meal({ cuisine: "italian" }), NO_DIETS, context())).toBe(true);
  });

  describe("diet", () => {
    it("keeps a candidate that matches at least one selected diet", () => {
      const vegetarian = ["vegetarian"];
      expect(isEligibleCandidate(meal(), vegetarian, context({ diets: ["vegetarian"] }))).toBe(true);
      // Partial match is enough — diet is deliberately permissive.
      expect(
        isEligibleCandidate(meal(), vegetarian, context({ diets: ["vegetarian", "gluten-free"] }))
      ).toBe(true);
    });

    it("drops a candidate whose diets miss every selected diet", () => {
      expect(isEligibleCandidate(meal(), ["keto"], context({ diets: ["vegan"] }))).toBe(false);
    });

    it("treats an untagged candidate as unrestricted", () => {
      // Menus and favorites saved before diets were recorded have no tags; a
      // strict rule would hide the user's whole back catalogue.
      expect(isEligibleCandidate(meal(), NO_DIETS, context({ diets: ["vegetarian"] }))).toBe(true);
    });
  });
});

describe("dietsFromPlannerState", () => {
  it("reads diets off a saved menu's planner state, ignoring everything else", () => {
    expect(dietsFromPlannerState({ cuisines: ["italian"], diets: ["vegan"], adults: 2 })).toEqual([
      "vegan",
    ]);
  });

  it("returns no diets for malformed or missing state", () => {
    expect(dietsFromPlannerState(null)).toEqual([]);
    expect(dietsFromPlannerState("nope")).toEqual([]);
    expect(dietsFromPlannerState({ diets: "vegan" })).toEqual([]);
  });

  it("discards non-string entries", () => {
    expect(dietsFromPlannerState({ diets: ["vegan", 7, null] })).toEqual(["vegan"]);
  });
});

describe("shuffle", () => {
  it("preserves every element and leaves the input untouched", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
