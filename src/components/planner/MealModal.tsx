"use client";

import { useState } from "react";
import { X, Flame, Dumbbell, Wheat, Droplets, Timer, Loader2, Heart, Stethoscope, Sparkles, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { MealRecipe, MealType } from "@/types/planner";

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snacks: "🍎",
};

export interface ReplaceContext {
  isBusyDay: boolean;
  cuisines: string[];
  diets: string[];
  cookingTime: number;
  notes: string;
  excludeNames: string[];
}

interface Props {
  recipe: MealRecipe;
  adults: number;
  onClose: () => void;
  sessionStatus: string;
  sourceMenuId: string | null;
  sourceDay: string;
  onRequestAuth: () => void;
  isDiabeticFriendly: boolean;
  replaceContext: ReplaceContext;
  onReplace: (meal: Omit<MealRecipe, "mealType">) => void;
}

type ReplaceResult = { candidates: Omit<MealRecipe, "mealType">[]; source: "favorite" | "ai" };

export function MealModal({
  recipe, adults, onClose, sessionStatus, sourceMenuId, sourceDay, onRequestAuth, isDiabeticFriendly,
  replaceContext, onReplace,
}: Props) {
  const [favId, setFavId] = useState<string | null>(null);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [favError, setFavError] = useState(false);
  const [isFindingReplacement, setIsFindingReplacement] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [result, setResult] = useState<ReplaceResult | null>(null);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidate = result?.candidates[candidateIndex] ?? null;

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

  const findReplacement = async () => {
    setIsFindingReplacement(true);
    setReplaceError(null);
    try {
      const res = await fetch("/api/menus/replace-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: recipe.mealType,
          isBusyDay: replaceContext.isBusyDay,
          cuisines: replaceContext.cuisines,
          diets: replaceContext.diets,
          cookingTime: replaceContext.cookingTime,
          notes: replaceContext.notes,
          excludeNames: [...replaceContext.excludeNames, recipe.name],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplaceError(data.message || "Couldn't find a replacement. Please try again.");
        return;
      }
      setResult({ candidates: data.candidates, source: data.source });
      setCandidateIndex(0);
    } catch (e) {
      console.error("Find replacement failed", e);
      setReplaceError("Couldn't find a replacement. Please try again.");
    } finally {
      setIsFindingReplacement(false);
    }
  };

  const showNextCandidate = (direction: 1 | -1) => {
    if (!result) return;
    setCandidateIndex((i) => (i + direction + result.candidates.length) % result.candidates.length);
  };

  const confirmReplacement = () => {
    if (!candidate) return;
    onReplace(candidate);
    onClose();
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

          {isDiabeticFriendly && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800">
              <Stethoscope size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
              <span>
                This recipe was AI-generated with diabetic-friendly guidance, not written or verified by a nutritionist or physician. Please check with your doctor or a registered dietitian before relying on it for strict dietary management.
              </span>
            </div>
          )}

          {/* Try Something Else */}
          {candidate && result ? (
            <div className="rounded-2xl border border-[#AF8F7C] bg-[#FAF6F1] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-[#AF8F7C] uppercase tracking-wide">
                  <Sparkles size={13} />
                  {result.source === "favorite" ? "From your favorites" : "New AI suggestion"}
                </div>
                {result.candidates.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-[#7A7168]">
                    <button
                      onClick={() => showNextCandidate(-1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      title="Previous"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {candidateIndex + 1} of {result.candidates.length}
                    <button
                      onClick={() => showNextCandidate(1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      title="Next"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
              <p className="font-serif text-[#3A332C] leading-snug">{candidate.name}</p>
              <p className="text-sm text-[#7A7168] font-light leading-relaxed">{candidate.description}</p>
              <p className="text-xs text-[#7A7168]">
                Prep {candidate.prepTime} min{candidate.cookTime > 0 ? ` · Cook ${candidate.cookTime} min` : ""}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={confirmReplacement}
                  className="flex-1 bg-[#AF8F7C] text-white text-sm font-medium py-2 rounded-full hover:bg-[#9A7B68] transition-colors"
                >
                  Use This Instead
                </button>
                {result.candidates.length === 1 && (
                  <button
                    onClick={findReplacement}
                    disabled={isFindingReplacement}
                    className="flex items-center gap-1 text-sm text-[#7A7168] px-3 py-2 rounded-full border border-[#EBE6DE] hover:border-[#AF8F7C]/50 transition-colors disabled:opacity-50"
                  >
                    {isFindingReplacement ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => { setResult(null); setReplaceError(null); }}
                  className="text-sm text-[#7A7168] px-3 py-2 rounded-full hover:bg-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={findReplacement}
                disabled={isFindingReplacement}
                className="flex items-center gap-2 text-sm font-medium text-[#AF8F7C] px-4 py-2 rounded-full border border-[#AF8F7C]/30 hover:bg-[#AF8F7C]/10 transition-colors disabled:opacity-50"
              >
                {isFindingReplacement ? (
                  <><Loader2 size={14} className="animate-spin" /> Finding a new idea…</>
                ) : (
                  <><Sparkles size={14} /> Try Something Else</>
                )}
              </button>
              {replaceError && <p className="text-xs text-red-500 mt-2">{replaceError}</p>}
            </div>
          )}

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
