export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";
export type CuisineType = "italian" | "mexican" | "asian" | "american" | "mediterranean" | "indian";
export type DietType = "none" | "vegetarian" | "vegan" | "gluten-free" | "keto" | "low-carb";

export interface PlannerState {
  adults: number;
  kids: number;
  kidsAges: number[];
  meals: MealType[];
  cuisines: CuisineType[];
  diets: string[];
  busyDays: string[];
  cookingTime: number;
  notes: string;
}

export interface MealRecipe {
  name: string;
  mealType: MealType;
  description: string;
  prepTime: number;
  cookTime: number;
  caloriesPerServing: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: { amount: string; item: string }[];
  steps: string[];
}

export interface AIGeneratedMenu {
  weeklyMenu: {
    day: string;
    meals: Record<string, Omit<MealRecipe, "mealType">>;
  }[];
  groceryList: {
    category: string;
    items: { amount: string; item: string }[];
  }[];
}
