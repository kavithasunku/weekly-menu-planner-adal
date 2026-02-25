"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  Check, Sparkles, X, Loader2, Heart, GripVertical,
  AlertTriangle, ArrowLeftRight, Timer,
} from "lucide-react";
import { MealType, PlannerState, AIGeneratedMenu, MealRecipe } from "@/types/planner";
import { MealModal } from "./MealModal";

interface DragItem {
  day: string;
  mealType: string;
}

const MEAL_ORDER: Record<MealType, number> = { breakfast: 0, lunch: 1, dinner: 2, snacks: 3 };
const MEAL_TYPE_ICONS: Record<string, string> = {
  Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snacks: "🍎",
};

interface Props {
  formData: PlannerState;
  generatedMenu: AIGeneratedMenu;
  onMenuSwap: (updated: AIGeneratedMenu) => void;
  savedMenuId: string | null;
  onReset: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  sessionStatus: string;
  onSaveClick: () => void;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export function ResultsStep({
  formData,
  generatedMenu,
  onMenuSwap,
  savedMenuId,
  onReset,
  isSaving,
  saveSuccess,
  sessionStatus,
  onSaveClick,
  isFavorite,
  onFavoriteToggle,
}: Props) {
  const [localMenu, setLocalMenu] = useState<AIGeneratedMenu>(() =>
    JSON.parse(JSON.stringify(generatedMenu))
  );
  const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
  const [selectedRecipeDay, setSelectedRecipeDay] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isInstacartLoading, setIsInstacartLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const dragItem = useRef<DragItem | null>(null);
  const isDragging = useRef(false);
  const [dragOver, setDragOver] = useState<DragItem | null>(null);

  const localMenuRef = useRef(localMenu);
  useEffect(() => { localMenuRef.current = localMenu; }, [localMenu]);

  const selectedMeals = [...(formData.meals as MealType[])].sort(
    (a, b) => MEAL_ORDER[a] - MEAL_ORDER[b]
  );

  const isComplexRecipe = (recipe: Omit<MealRecipe, "mealType">) =>
    (recipe.prepTime + recipe.cookTime) > formData.cookingTime;

  const performSwap = async (src: DragItem, dest: DragItem) => {
    if (src.day === dest.day && src.mealType === dest.mealType) return;

    const updated: AIGeneratedMenu = JSON.parse(JSON.stringify(localMenuRef.current));
    const srcDayObj = updated.weeklyMenu.find((d) => d.day === src.day);
    const destDayObj = updated.weeklyMenu.find((d) => d.day === dest.day);
    if (!srcDayObj || !destDayObj) return;

    const srcMeal = srcDayObj.meals[src.mealType] ?? null;
    const destMeal = destDayObj.meals[dest.mealType] ?? null;

    if (srcMeal) destDayObj.meals[dest.mealType] = srcMeal;
    else delete destDayObj.meals[dest.mealType];
    if (destMeal) srcDayObj.meals[src.mealType] = destMeal;
    else delete srcDayObj.meals[src.mealType];

    localMenuRef.current = updated;
    setLocalMenu(updated);
    onMenuSwap(updated);
    setSwapSuccess(true);
    setTimeout(() => setSwapSuccess(false), 2000);

    if (savedMenuId) {
      setIsSwapping(true);
      try {
        await fetch(`/api/menus/${savedMenuId}/swap`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: { day: src.day, mealType: src.mealType },
            destination: { day: dest.day, mealType: dest.mealType },
          }),
        });
      } catch (e) {
        console.error("Swap persist failed", e);
      } finally {
        setIsSwapping(false);
      }
    }
  };

  const handleDragStart = (item: DragItem) => {
    dragItem.current = item;
    isDragging.current = true;
  };

  const handleDragOver = (e: React.DragEvent, item: DragItem) => {
    e.preventDefault();
    setDragOver(item);
  };

  const handleDrop = (e: React.DragEvent, dest: DragItem) => {
    e.preventDefault();
    if (dragItem.current) performSwap(dragItem.current, dest);
    dragItem.current = null;
    setDragOver(null);
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOver(null);
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const handleInstacartShopping = async () => {
    setIsInstacartLoading(true);
    try {
      const res = await fetch("/api/instacart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groceryList: localMenu.groceryList }),
      });
      if (!res.ok) throw new Error("Failed to generate Instacart link");
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error(error);
      alert("Failed to connect to Instacart. Please try again later.");
    } finally {
      setIsInstacartLoading(false);
    }
  };

  const handleSave = () => {
    if (sessionStatus === "unauthenticated") {
      setShowAuthModal(true);
      onSaveClick();
    } else {
      onSaveClick();
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await signIn("resend", { email, redirect: false, callbackUrl: "/planner" });
    setEmailSent(true);
  };

  const handleMealClick = (recipe: Omit<MealRecipe, "mealType">, mealTypeStr: string, day: string) => {
    const scaledIngredients = recipe.ingredients.map((ing) => ({
      ...ing,
      amount: formData.adults > 1
        ? ing.amount.replace(/(\d+(?:\.\d+)?)/g, (n) => {
            const scaled = parseFloat(n) * formData.adults;
            return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
          })
        : ing.amount,
    }));
    setSelectedRecipeDay(day);
    setSelectedRecipe({ ...recipe, mealType: mealTypeStr.toLowerCase() as MealType, ingredients: scaledIngredients });
  };

  return (
    <>
      {selectedRecipe && (
        <MealModal
          recipe={selectedRecipe}
          adults={formData.adults}
          onClose={() => setSelectedRecipe(null)}
          sessionStatus={sessionStatus}
          sourceMenuId={savedMenuId}
          sourceDay={selectedRecipeDay}
          onRequestAuth={() => { setSelectedRecipe(null); setShowAuthModal(true); }}
        />
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#AF8F7C] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Your Weekly Menu</h2>
          <p className="text-[#7A7168] font-light">
            {formData.adults} adult{formData.adults !== 1 ? "s" : ""}
            {formData.kids > 0 && `, ${formData.kids} kid${formData.kids !== 1 ? "s" : ""}`}
            {" · "}{formData.diets.map((d) => d.replace("-", " ")).join(", ")}
            {" · "}{selectedMeals.length} meal{selectedMeals.length !== 1 ? "s" : ""}/day
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <p className="text-xs text-[#AF8F7C]">
              <GripVertical size={12} className="inline mr-1" />
              Drag meals between days to rearrange · Tap to view recipe
            </p>
            {swapSuccess && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 flex items-center gap-1">
                <ArrowLeftRight size={11} /> Swapped!
              </span>
            )}
            {isSwapping && (
              <span className="text-xs text-[#7A7168] flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Saving…
              </span>
            )}
          </div>
        </div>

        {/* Busy Days Banner */}
        {(() => {
          if (formData.busyDays.length === 0) return null;
          const conflicting: { day: string; name: string }[] = [];
          localMenu.weeklyMenu.forEach(({ day, meals }) => {
            if (!formData.busyDays.includes(day)) return;
            Object.values(meals).forEach((recipe) => {
              if (recipe && isComplexRecipe(recipe)) conflicting.push({ day, name: recipe.name });
            });
          });
          if (conflicting.length === 0) {
            return (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 text-xs text-green-800">
                <Check size={14} className="flex-shrink-0 text-green-500" />
                <span>All meals on busy days fit within your {formData.cookingTime} min cooking budget.</span>
              </div>
            );
          }
          return (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
              <span>
                <span className="font-semibold">{conflicting.length} meal{conflicting.length !== 1 ? "s" : ""} on busy days</span> exceed your {formData.cookingTime} min budget
                {" "}({conflicting.map((m) => `${m.day.slice(0, 3)}: ${m.name}`).join(" · ")}).
                {" "}Drag them to a free day to resolve.
              </span>
            </div>
          );
        })()}

        {/* Calendar Grid */}
        <div className="overflow-x-auto -mx-2 px-2">
          <div
            className="min-w-[560px]"
            style={{ display: "grid", gridTemplateColumns: `90px repeat(${selectedMeals.length}, 1fr)`, gap: "6px" }}
          >
            {/* Header row */}
            <div className="sticky left-0" />
            {selectedMeals.map((mealType) => {
              const name = mealType.charAt(0).toUpperCase() + mealType.slice(1);
              return (
                <div key={mealType} className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#FAF6F1] rounded-xl border border-[#EBE6DE] text-xs font-semibold text-[#7A7168] uppercase tracking-wide">
                  <span>{MEAL_TYPE_ICONS[name]}</span>
                  <span className="hidden sm:inline">{name}</span>
                </div>
              );
            })}

            {/* Day rows */}
            {localMenu.weeklyMenu.map(({ day, meals }) => {
              const isBusy = formData.busyDays.includes(day);
              return [
                <div
                  key={`label-${day}`}
                  className={`flex flex-col items-start justify-center px-2 py-3 rounded-xl border text-xs font-semibold sticky left-0 z-10 ${
                    isBusy
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-[#FDFBF7] border-[#EBE6DE] text-[#7A7168]"
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  {isBusy && <span className="text-[10px] font-normal text-amber-600 mt-0.5">Busy</span>}
                </div>,

                ...selectedMeals.map((mealType) => {
                  const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                  const recipe = meals[mealName];
                  const isDragTarget = dragOver?.day === day && dragOver?.mealType === mealName;
                  const isConflict = isBusy && recipe && isComplexRecipe(recipe);

                  return (
                    <div
                      key={`${day}-${mealType}`}
                      onDragOver={(e) => handleDragOver(e, { day, mealType: mealName })}
                      onDrop={(e) => handleDrop(e, { day, mealType: mealName })}
                      className={`relative rounded-xl border transition-all min-h-[80px] ${
                        isDragTarget
                          ? "border-[#AF8F7C] bg-[#FAF6F1] shadow-lg shadow-[#AF8F7C]/20 scale-[1.02]"
                          : isConflict
                          ? "border-amber-200 bg-amber-50"
                          : "border-[#EBE6DE] bg-white"
                      }`}
                    >
                      {recipe ? (
                        <div
                          draggable
                          onDragStart={() => handleDragStart({ day, mealType: mealName })}
                          onDragEnd={handleDragEnd}
                          onClick={() => { if (!isDragging.current) handleMealClick(recipe, mealName, day); }}
                          className="h-full p-2.5 cursor-grab active:cursor-grabbing group"
                        >
                          {isConflict && (
                            <span className="absolute top-1.5 right-1.5 text-amber-500" title={`${recipe.prepTime + recipe.cookTime} min – exceeds ${formData.cookingTime} min budget`}>
                              <AlertTriangle size={12} />
                            </span>
                          )}
                          <div className="absolute top-1.5 left-1.5 text-[#C8C0B8] opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical size={12} />
                          </div>
                          <div className="flex items-center gap-1 mb-1.5 mt-0.5 pl-3">
                            <Timer size={10} className="text-[#AF8F7C]" />
                            <span className="text-[10px] text-[#AF8F7C]">{recipe.prepTime + recipe.cookTime}m</span>
                          </div>
                          <p className="text-xs font-medium text-[#3A332C] leading-snug line-clamp-2 group-hover:text-[#AF8F7C] transition-colors">
                            {recipe.name}
                          </p>
                          <span className="text-[10px] text-[#B8B0A4] group-hover:text-[#AF8F7C] transition-colors mt-0.5 block">
                            View recipe →
                          </span>
                        </div>
                      ) : (
                        <div className={`h-full min-h-[80px] flex items-center justify-center transition-all ${isDragTarget ? "text-[#AF8F7C]" : "text-[#D4CEC6]"}`}>
                          <span className="text-xs">{isDragTarget ? "Drop here" : "—"}</span>
                        </div>
                      )}
                    </div>
                  );
                }),
              ];
            })}
          </div>
        </div>

        {/* Grocery List */}
        <div className="mt-8 p-6 bg-[#FDFBF7] rounded-2xl border border-[#EBE6DE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h3 className="text-lg font-serif text-[#3A332C]">Weekly Grocery List</h3>
            </div>
            <button
              onClick={handleInstacartShopping}
              disabled={isInstacartLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8C7362] text-white rounded-xl font-medium hover:bg-[#7A6352] transition-all shadow-md shadow-[#8C7362]/20 disabled:opacity-70 text-sm"
            >
              {isInstacartLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Preparing cart...</>
              ) : (
                <>Shop on Instacart</>
              )}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {localMenu.groceryList.map((categoryGroup, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-[#EBE6DE]">
                <span className="text-xs font-medium text-[#AF8F7C] uppercase">{categoryGroup.category}</span>
                <ul className="mt-2 space-y-1 text-[#7A7168]">
                  {categoryGroup.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#AF8F7C] flex-shrink-0" />
                      <span className="font-medium text-[#3A332C]">{item.amount}</span> {item.item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onReset}
            className="flex-1 py-4 rounded-2xl font-medium border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={onFavoriteToggle}
            className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all ${
              isFavorite
                ? "bg-red-50 border-red-200 text-red-500 shadow-sm shadow-red-100"
                : "bg-white border-[#EBE6DE] text-[#B8B0A4] hover:border-red-200 hover:text-red-400"
            }`}
            title="Save as Favorite"
          >
            <Heart size={24} className={isFavorite ? "fill-current" : ""} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl font-medium transition-all shadow-lg ${
              saveSuccess
                ? "bg-[#8C7362] text-white shadow-[#8C7362]/20"
                : "bg-[#AF8F7C] text-white hover:bg-[#9A7B68] shadow-[#AF8F7C]/20"
            } disabled:opacity-80`}
          >
            {isSaving ? (
              <><Loader2 size={20} className="animate-spin" /> Saving...</>
            ) : saveSuccess ? (
              <><Check size={20} /> Saved!</>
            ) : (
              "Save Menu"
            )}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#3A332C]/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#EBE6DE] p-8 overflow-hidden">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#7A7168] hover:text-[#3A332C] transition-colors"
            >
              <X size={16} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EBE6DE]">
                <Sparkles size={28} className="text-[#AF8F7C]" />
              </div>
              <h3 className="text-2xl font-serif text-[#3A332C] mb-2">Save your menu</h3>
              <p className="text-[#7A7168] font-light">Create a free account to save and access your weekly menus from anywhere.</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => signIn("google", { callbackUrl: "/planner" })}
                className="w-full flex items-center justify-center gap-3 bg-white border border-[#EBE6DE] text-[#3A332C] py-3.5 rounded-xl font-medium hover:bg-[#FDFBF7] hover:border-[#AF8F7C]/50 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#EBE6DE]" />
                <span className="flex-shrink-0 mx-4 text-[#B8B0A4] text-sm">or</span>
                <div className="flex-grow border-t border-[#EBE6DE]" />
              </div>
              {emailSent ? (
                <div className="bg-[#FAF6F1] p-4 rounded-xl text-center border border-[#AF8F7C]/30">
                  <p className="text-[#3A332C] font-medium mb-1">Check your email!</p>
                  <p className="text-sm text-[#7A7168]">We sent a magic link to {email}</p>
                </div>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3.5 bg-[#FDFBF7] border border-[#EBE6DE] rounded-xl text-[#3A332C] focus:outline-none focus:border-[#AF8F7C] transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#AF8F7C] text-white py-3.5 rounded-xl font-medium hover:bg-[#9A7B68] transition-colors shadow-md shadow-[#AF8F7C]/20"
                  >
                    Continue with Email
                  </button>
                </form>
              )}
            </div>
            <p className="text-center text-xs text-[#B8B0A4] mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
