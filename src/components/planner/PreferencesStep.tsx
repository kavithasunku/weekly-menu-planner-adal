"use client";

import { MealType, CuisineType, DietType, PlannerState } from "@/types/planner";

const MEALS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snacks", label: "Snacks" },
];

const CUISINES: { id: CuisineType; label: string }[] = [
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
  { id: "asian", label: "Asian" },
  { id: "american", label: "American" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "indian", label: "Indian" },
];

const DIETS: { id: DietType; label: string }[] = [
  { id: "none", label: "No restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "keto", label: "Keto" },
  { id: "low-carb", label: "Low-carb" },
];

interface Props {
  formData: PlannerState;
  toggleMeal: (meal: MealType) => void;
  toggleCuisine: (cuisine: CuisineType) => void;
  toggleDiet: (diet: string) => void;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
}

export function PreferencesStep({ formData, toggleMeal, toggleCuisine, toggleDiet, updateForm }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Taste Preferences</h2>
        <p className="text-[#7A7168] font-light">What does your family love to eat?</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Meals to Plan</label>
        <div className="flex flex-wrap gap-3">
          {MEALS.map((meal) => (
            <button
              key={meal.id}
              onClick={() => toggleMeal(meal.id)}
              className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                formData.meals.includes(meal.id)
                  ? "bg-[#AF8F7C] text-white shadow-md shadow-[#AF8F7C]/20"
                  : "bg-white border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50"
              }`}
            >
              {meal.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Favorite Cuisines</label>
        <div className="flex flex-wrap gap-3">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => toggleCuisine(cuisine.id)}
              className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                formData.cuisines.includes(cuisine.id)
                  ? "bg-[#AF8F7C] text-white shadow-md shadow-[#AF8F7C]/20"
                  : "bg-white border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50"
              }`}
            >
              {cuisine.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Dietary Restrictions</label>
        <div className="grid sm:grid-cols-2 gap-3">
          {DIETS.map((diet) => (
            <button
              key={diet.id}
              onClick={() => toggleDiet(diet.id)}
              className={`p-4 rounded-2xl text-left transition-all ${
                formData.diets.includes(diet.id)
                  ? "bg-[#AF8F7C] text-white shadow-md shadow-[#AF8F7C]/20"
                  : "bg-white border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50"
              }`}
            >
              {diet.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Additional Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateForm("notes", e.target.value)}
          placeholder="Any other preferences, allergies, or details we should know about? (e.g., &quot;No fish due to allergy&quot;, &quot;Love spicy food&quot;, &quot;Budget-friendly meals&quot;)"
          className="w-full p-4 bg-[#FDFBF7] border border-[#EBE6DE] rounded-2xl text-[#3A332C] placeholder-[#B8B0A4] focus:border-[#AF8F7C] focus:outline-none resize-none h-28"
        />
      </div>
    </div>
  );
}
