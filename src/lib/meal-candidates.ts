/**
 * Shared filtering for meal-replacement candidates.
 *
 * Two sources feed the "replace this meal" flow in `MealModal`:
 *   - the user's `FavoriteRecipe` library (`/api/menus/replace-meal`)
 *   - meals inside the user's previously saved menus (`/api/menus/past-meals`)
 *
 * Both are deterministic pulls from what the user already has — no AI call.
 *
 * Deliberately *not* filtered on: cuisine. Both sources are the user's own
 * curated back catalogue, and wanting an Italian favorite in an otherwise
 * north-Indian week is a normal thing to want, not a mistake to prevent. The
 * remaining planner selections (diet, cooking time, busy day) are honoured,
 * since those describe what the household can actually eat and cook.
 */

export interface CandidateContext {
  /** Planner diet selections. Empty means "no diet restriction". */
  diets: string[];
  /** Planner cooking-time budget, in minutes. */
  cookingTime: number;
  /** Whether the slot being replaced falls on a day the user marked busy. */
  isBusyDay: boolean;
  /** Meal names already present in the menu; never offer these back. */
  excludeNames: string[];
}

/** Busy days get an ultra-fast budget regardless of the global setting. */
export const BUSY_DAY_MAX_MINUTES = 15;

/** Most candidates we ever hand back to the client for one slot. */
export const MAX_CANDIDATES = 8;

export function maxMinutesFor(context: Pick<CandidateContext, "isBusyDay" | "cookingTime">): number {
  return context.isBusyDay ? BUSY_DAY_MAX_MINUTES : context.cookingTime;
}

/** A recipe blob straight out of Json columns — shape is not guaranteed. */
export type RawMeal = Record<string, unknown>;

/**
 * Narrows an untrusted Json blob to something with at least a usable name, and
 * strips the `mealType` key (menus store the meal type as the object key, so a
 * stray `mealType` field from a favorite would leak into the saved menu).
 */
export function normalizeMeal(raw: unknown): (RawMeal & { name: string }) | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { mealType, ...meal } = raw as RawMeal;
  void mealType;
  if (typeof meal.name !== "string" || meal.name.trim() === "") return null;
  return meal as RawMeal & { name: string };
}

function totalMinutes(meal: RawMeal): number {
  const prepTime = typeof meal.prepTime === "number" ? meal.prepTime : 0;
  const cookTime = typeof meal.cookTime === "number" ? meal.cookTime : 0;
  return prepTime + cookTime;
}

/**
 * Whether a candidate meal may be offered as a replacement.
 *
 * Diet matches permissively: overlapping on one selected diet is enough, and a
 * candidate with no diet tags at all (e.g. a favorite or menu saved before the
 * field existed) counts as unrestricted. Tagging coverage is patchy enough that
 * a strict rule mostly just returned nothing, and the user previews and
 * confirms every candidate before it overwrites a slot.
 */
export function isEligibleCandidate(
  meal: RawMeal & { name: string },
  /** Diets tagged on the favorite, or on the planner state of its source menu. */
  candidateDiets: string[],
  context: CandidateContext
): boolean {
  if (context.excludeNames.includes(meal.name)) return false;
  if (totalMinutes(meal) > maxMinutesFor(context)) return false;
  if (context.diets.length > 0 && candidateDiets.length > 0) {
    if (!candidateDiets.some((d) => context.diets.includes(d))) return false;
  }
  return true;
}

/** Fisher-Yates — `sort(() => Math.random() - 0.5)` is not a uniform shuffle. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Reads `diets` off a saved menu's `plannerState` Json blob. */
export function dietsFromPlannerState(plannerState: unknown): string[] {
  const state = (plannerState && typeof plannerState === "object" ? plannerState : {}) as RawMeal;
  if (!Array.isArray(state.diets)) return [];
  return state.diets.filter((d): d is string => typeof d === "string");
}
