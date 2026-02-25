"use client";

import { useState } from "react";
import { X, Flame, Dumbbell, Wheat, Droplets, Timer, Loader2, Heart } from "lucide-react";
import { MealRecipe, MealType } from "@/types/planner";

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snacks: "🍎",
};

interface Props {
  recipe: MealRecipe;
  adults: number;
  onClose: () => void;
  sessionStatus: string;
  sourceMenuId: string | null;
  sourceDay: string;
  onRequestAuth: () => void;
}

export function MealModal({ recipe, adults, onClose, sessionStatus, sourceMenuId, sourceDay, onRequestAuth }: Props) {
  const [favId, setFavId] = useState<string | null>(null);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [favError, setFavError] = useState(false);

  const totalCalories = recipe.caloriesPerServing * adults;
  const totalProtein = recipe.protein * adults;
  const totalCarbs = recipe.carbs * adults;
  const totalFat = recipe.fat * adults;

  const handleFavoriteToggle = async () => {
    if (sessionStatus !== "authenticated") {
      onRequestAuth();
      return;
    }
    setIsSavingFav(true);
    setFavError(false);
    try {
      if (favId) {
        const res = await fetch(`/api/recipes/favorites/${favId}`, { method: "DELETE" });
        if (res.ok || res.status === 204) setFavId(null);
        else setFavError(true);
      } else {
        const res = await fetch("/api/recipes/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeName: recipe.name,
            recipeData: recipe,
            sourceMenuId,
            sourceDay,
            sourceMealType: recipe.mealType,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setFavId(data.id);
        } else {
          setFavError(true);
        }
      }
    } catch (e) {
      console.error("Favorite toggle failed", e);
      setFavError(true);
    } finally {
      setIsSavingFav(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#3A332C]/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#EBE6DE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#EBE6DE] px-6 py-4 rounded-t-[2rem] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{MEAL_TYPE_ICONS[recipe.mealType]}</span>
              <span className="text-xs font-medium text-[#AF8F7C] uppercase tracking-wide">{recipe.mealType}</span>
            </div>
            <h3 className="text-xl font-serif text-[#3A332C] leading-snug">{recipe.name}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleFavoriteToggle}
              disabled={isSavingFav}
              title={
                sessionStatus !== "authenticated"
                  ? "Sign in to save favorites"
                  : favId
                  ? "Remove from favorites"
                  : "Save to favorites"
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                favError
                  ? "bg-red-50 border-red-300 text-red-400"
                  : favId
                  ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                  : sessionStatus !== "authenticated"
                  ? "bg-[#FDFBF7] border-[#EBE6DE] text-[#C8C0B8] hover:border-[#AF8F7C]/40 hover:text-[#AF8F7C]"
                  : "bg-[#FDFBF7] border-[#EBE6DE] text-[#B8B0A4] hover:border-red-200 hover:text-red-400"
              } disabled:opacity-50`}
            >
              {isSavingFav ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Heart size={14} className={favId ? "fill-current" : ""} />
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-[#FDFBF7] border border-[#EBE6DE] flex items-center justify-center text-[#7A7168] hover:border-[#AF8F7C]/50 hover:text-[#3A332C] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <p className="text-[#7A7168] font-light leading-relaxed">{recipe.description}</p>

          {/* Timing */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-[#7A7168]">
              <Timer size={15} className="text-[#AF8F7C]" />
              <span>Prep: <span className="font-medium text-[#3A332C]">{recipe.prepTime} min</span></span>
            </div>
            {recipe.cookTime > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#7A7168]">
                <Timer size={15} className="text-[#AF8F7C]" />
                <span>Cook: <span className="font-medium text-[#3A332C]">{recipe.cookTime} min</span></span>
              </div>
            )}
          </div>

          {/* Nutrition */}
          <div className="bg-[#FDFBF7] rounded-2xl p-4 border border-[#EBE6DE]">
            <p className="text-xs font-medium text-[#7A7168] uppercase tracking-wide mb-3">
              Nutrition for {adults} adult{adults !== 1 ? "s" : ""} ({recipe.caloriesPerServing} kcal / serving)
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { icon: <Flame size={16} className="text-orange-400" />, value: totalCalories, label: "kcal" },
                { icon: <Dumbbell size={16} className="text-blue-400" />, value: `${totalProtein}g`, label: "protein" },
                { icon: <Wheat size={16} className="text-amber-400" />, value: `${totalCarbs}g`, label: "carbs" },
                { icon: <Droplets size={16} className="text-green-400" />, value: `${totalFat}g`, label: "fat" },
              ].map(({ icon, value, label }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-center">{icon}</div>
                  <p className="text-lg font-serif text-[#3A332C]">{value}</p>
                  <p className="text-xs text-[#7A7168]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="text-sm font-medium text-[#3A332C] mb-3">
              Ingredients <span className="text-[#7A7168] font-normal">(scaled for {adults} adult{adults !== 1 ? "s" : ""})</span>
            </h4>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#AF8F7C] flex-shrink-0 mt-1.5" />
                  <span className="text-[#AF8F7C] font-medium min-w-[80px]">{ing.amount}</span>
                  <span className="text-[#3A332C]">{ing.item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h4 className="text-sm font-medium text-[#3A332C] mb-3">Method</h4>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#AF8F7C]/15 text-[#AF8F7C] font-medium flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="text-[#7A7168] leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
