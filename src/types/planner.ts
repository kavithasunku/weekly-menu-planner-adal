export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";
export type CuisineType = "italian" | "mexican" | "asian" | "american" | "mediterranean" | "north-indian" | "south-indian";
export type DietType = "none" | "vegetarian" | "vegan" | "gluten-free" | "keto" | "low-carb" | "diabetic-friendly";

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

export type PrepCategory = "Chop & Prep" | "Marinate" | "Soak & Sprout" | "Ferment" | "Cook Ahead";

export interface PrepTask {
  task: string;
  timeMinutes: number;
  suggestedDay: string;
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
  // Optional: older saved menus (generated before this feature) won't have it.
  prepPlan?: {
    category: PrepCategory;
    tasks: PrepTask[];
  }[];
}
