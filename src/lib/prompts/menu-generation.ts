export interface PromptParams {
  adults: number;
  kids: number;
  kidsAges: number[];
  meals: string[];
  cuisines: string[];
  diets: string[];
  busyDays: string[];
  cookingTime: number;
  notes: string;
}

const DIABETIC_FRIENDLY_GUIDANCE = `
  ## ⚠️ DIABETIC-FRIENDLY CONSTRAINTS - STRICTLY ENFORCE
  The user selected "Diabetic-friendly" as a dietary restriction. For every meal:
  1. ✓ Favor low-to-moderate glycemic index carbs (whole grains, legumes, non-starchy vegetables) over refined carbs (white rice, white bread/pasta, refined flour, sugary cereal).
  2. ✓ No added sugars, sugary sauces/glazes, desserts, or sweetened beverages/juices — use spices, herbs, citrus, or sugar-free alternatives for flavor instead.
  3. ✓ Pair every carb source with fiber, protein, or healthy fat in the same meal (e.g., grains + legumes/lean protein/nuts) to blunt blood-sugar spikes.
  4. ✓ Keep starchy-carb portions moderate and roughly consistent meal-to-meal rather than one very carb-heavy meal.
  5. ✓ Prefer grilling, steaming, roasting, or sautéing over deep-frying or heavy cream/butter-based sauces.
  Note in the recipe descriptions is not required, but the above must be reflected in the actual ingredients and preparation. This is general dietary guidance, not medical advice — it does not replace a doctor's or dietitian's individualized carb/insulin targets.
`;

export function buildMenuGenerationPrompt(params: PromptParams): string {
  const { adults, kids, kidsAges, meals, cuisines, diets, busyDays, cookingTime, notes } = params;
  const isDiabeticFriendly = diets.some((d) => d.toLowerCase() === "diabetic-friendly");

  return `You are an expert meal planner, dietician and culinary assistant. Create personalized weekly menu plans that are practical, nutritious, and delicious. Use the user preferences provided separately to customize all meal suggestions.
  Create a 7-day weekly menu plan for a family of ${adults} adults and ${kids} kids (ages: ${kidsAges.join(", ")}).
  ## ⚠️ CRITICAL CONSTRAINTS - VALIDATE EVERY MENU
  Before suggesting ANY menu, you MUST validate:
  1. ✓ Total complex meals per week ≤ user's specified limit (typically 2-3 max)
  2. ✓ No more than 1 complex dish per day
  3. ✓ Each individual meal's (cookingTime) MUST be ≤ the user's maximum cooking time for that day — NO EXCEPTIONS
  4. ✓ For BUSY days: each meal's (cookingTime) MUST be ≤ 15 minutes — NO EXCEPTIONS
  5. ✓ For REGULAR days: each meal's (cookingTime) MUST be ≤ ${cookingTime} minutes — NO EXCEPTIONS
  6. ✓ All dietary restrictions strictly followed
  ${isDiabeticFriendly ? DIABETIC_FRIENDLY_GUIDANCE : ""}
  ## COMPLEXITY DEFINITION - STRICTLY ENFORCE

### What Makes a Dish COMPLEX:
**A dish is COMPLEX if it meets ANY of these criteria:**
- Takes >30 minutes of active cooking time (excluding soaking/fermenting)
- Requires multiple cooking stages or techniques
- Needs many ingredients (>10 items)
- Has elaborate preparation steps

**COMPLEX Examples:**
- ❌ Biryani, Pulav (multi-stage, many ingredients)
- ❌ Bisibele Bath (requires multiple steps, tempering, pressure cooking)
- ❌ Masala Dosa with multiple chutneys (dosa is simple, but making 2-3 chutneys makes it complex)
- ❌ Parathas with elaborate stuffing (aloo paratha, paneer paratha)
- ❌ Chole Bhature, Pav Bhaji

  Preferences:
  - Meals to plan per day: ${meals.join(", ")}
  - Dietary restrictions: ${diets.join(", ")}
  - Preferred cuisines: ${cuisines.join(", ")}
  - Maximum cooking time on regular days: ${cookingTime} minutes
  - Busy days (need ultra-fast meals under 15 mins, or leftovers): ${busyDays.join(", ")}
  ## ⚠️ MANDATORY USER NOTES — HIGHEST PRIORITY
  The user has provided the following additional notes. Treat these as **mandatory overrides** that take precedence over all default suggestions. Every single meal generated MUST comply with these notes:
  "${notes || "None"}"
  If the notes conflict with other preferences, the notes WIN. Do not ignore or deprioritize them.

  Generate a diverse, delicious, and realistic menu.
  - Each day contains a list of meals. For each meal, include the "type" (e.g., "Breakfast", "Dinner") and the recipe scaled for ONE serving (the UI will multiply by the number of adults).
  - Ensure the meals exactly match the requested "Meals to plan per day" (e.g., if only Dinner is requested, only generate Dinner).
  - Make the 'amount' field in ingredients easily multipliable (e.g., "1 cup", "200g", "0.5 tsp").
  - Generate a consolidated, categorized grocery list for the entire week based on the recipes.`;
}

export interface MealReplacementPromptParams {
  mealType: string;
  isBusyDay: boolean;
  cuisines: string[];
  diets: string[];
  cookingTime: number;
  notes: string;
  excludeNames: string[];
}

export function buildMealReplacementPrompt(params: MealReplacementPromptParams): string {
  const { mealType, isBusyDay, cuisines, diets, cookingTime, notes, excludeNames } = params;
  const isDiabeticFriendly = diets.some((d) => d.toLowerCase() === "diabetic-friendly");
  const maxMinutes = isBusyDay ? 15 : cookingTime;

  return `You are an expert meal planner, dietician and culinary assistant. Suggest ONE alternative ${mealType} recipe to replace a meal the user didn't like, scaled for ONE serving (the UI will multiply by the number of adults).
  ## ⚠️ CRITICAL CONSTRAINTS
  1. ✓ Total cooking time (prepTime + cookTime) MUST be ≤ ${maxMinutes} minutes — NO EXCEPTIONS${isBusyDay ? " (this is a busy day)" : ""}
  2. ✓ All dietary restrictions strictly followed: ${diets.join(", ")}
  3. ✓ Preferred cuisines (if any): ${cuisines.join(", ") || "no preference"}
  4. ✓ Do NOT suggest any of these meals, already used elsewhere this week: ${excludeNames.join(", ") || "none"}
  ${isDiabeticFriendly ? DIABETIC_FRIENDLY_GUIDANCE : ""}
  ## ⚠️ MANDATORY USER NOTES — HIGHEST PRIORITY
  "${notes || "None"}"
  If the notes conflict with other preferences, the notes WIN.

  Return exactly one recipe with "type": "${mealType}". Make the 'amount' field in ingredients easily multipliable (e.g., "1 cup", "200g", "0.5 tsp").`;
}
