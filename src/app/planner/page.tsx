"use client";

import { useState, useEffect, useRef } from "react";
import { ChefHat, ArrowRight, ArrowLeft, Users, Clock, Utensils, Check, Sparkles, X, Flame, Dumbbell, Wheat, Droplets, Timer, Loader2, Heart, GripVertical, AlertTriangle, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";
type CuisineType = "italian" | "mexican" | "asian" | "american" | "mediterranean" | "indian";
type DietType = "none" | "vegetarian" | "vegan" | "gluten-free" | "keto" | "low-carb";

interface PlannerState {
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

interface MealRecipe {
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

interface AIGeneratedMenu {
  weeklyMenu: {
    day: string;
    meals: Record<string, Omit<MealRecipe, "mealType">>;
  }[];
  groceryList: {
    category: string;
    items: { amount: string; item: string }[];
  }[];
}

const STEPS = [
  { id: 1, title: "Family", icon: Users },
  { id: 2, title: "Schedule", icon: Clock },
  { id: 3, title: "Preferences", icon: Utensils },
];

export default function PlannerPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isComplete, setIsComplete] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<AIGeneratedMenu | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedMenuId, setSavedMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlannerState>({
    adults: 2,
    kids: 0,
    kidsAges: [],
    meals: ["dinner"],
    cuisines: [],
    diets: ["none"],
    busyDays: [],
    cookingTime: 30,
    notes: "",
  });

  // Restore state and auto-save logic if there's a pending menu
  useEffect(() => {
    const pendingMenu = localStorage.getItem("pendingMenu");
    if (!pendingMenu) return;

    try {
      const menuData = JSON.parse(pendingMenu);
      
      // Always restore UI state if we have a pending menu
      if (!isComplete) {
        setFormData(menuData.formData);
        setGeneratedMenu(menuData.generatedMenu);
        setIsFavorite(menuData.isFavorite || false);
        setIsComplete(true);
        setCurrentStep(3);
      }

      // Auto-save if authenticated
      if (status === "authenticated" && !isSaving && !saveSuccess) {
        setIsSaving(true);
        fetch("/api/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Menu generated on ${new Date().toLocaleDateString()}`,
            plannerState: menuData.formData,
            generatedMenu: menuData.generatedMenu,
            isFavorite: menuData.isFavorite || false,
          }),
        })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setSavedMenuId(data.id);
            setSaveSuccess(true);
            localStorage.removeItem("pendingMenu");
          }
        })
        .catch(e => console.error("Auto-save failed", e))
        .finally(() => setIsSaving(false));
      }
    } catch (e) {
      console.error("Failed to parse pendingMenu", e);
    }
  }, [status, isComplete, isSaving, saveSuccess]);

  const updateKidsCount = (newCount: number) => {
    const currentAges = [...formData.kidsAges];
    if (newCount > currentAges.length) {
      for (let i = currentAges.length; i < newCount; i++) {
        currentAges.push(5);
      }
    } else {
      currentAges.splice(newCount);
    }
    setFormData((prev) => ({ ...prev, kids: newCount, kidsAges: currentAges }));
  };

  const updateKidAge = (index: number, age: number) => {
    const newAges = [...formData.kidsAges];
    newAges[index] = age;
    setFormData((prev) => ({ ...prev, kidsAges: newAges }));
  };

  const totalServings = formData.adults + formData.kids;

  const toggleDiet = (dietId: string) => {
    let current = formData.diets || [];
    if (dietId === "none") {
      current = ["none"];
    } else {
      current = current.filter((d) => d !== "none");
      if (current.includes(dietId)) {
        current = current.filter((d) => d !== dietId);
        if (current.length === 0) current = ["none"];
      } else {
        current = [...current, dietId];
      }
    }
    updateForm("diets", current);
  };

  const updateForm = (field: keyof PlannerState, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMeal = (meal: MealType) => {
    const current = formData.meals as MealType[];
    const updated = current.includes(meal)
      ? current.filter((m) => m !== meal)
      : [...current, meal];
    updateForm("meals", updated);
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    const current = formData.cuisines as CuisineType[];
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    updateForm("cuisines", updated);
  };

  const toggleBusyDay = (day: string) => {
    const current = formData.busyDays as string[];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateForm("busyDays", updated);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate menu");

      const data = await response.json();
      setGeneratedMenu(data);
      setIsComplete(true);
    } catch (error) {
      console.error(error);
      alert("Failed to generate menu. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    if (isComplete && generatedMenu) {
      return (
        <ResultsStep
          formData={formData}
          generatedMenu={generatedMenu}
          onMenuSwap={(updatedMenu) => setGeneratedMenu(updatedMenu)}
          savedMenuId={savedMenuId}
          onReset={() => {
            setIsComplete(false);
            setGeneratedMenu(null);
            setSaveSuccess(false);
            setIsFavorite(false);
            setSavedMenuId(null);
          }}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          sessionStatus={status}
          onSaveClick={async () => {
            if (status === "unauthenticated") {
               // Store in localStorage and show auth modal (handled in ResultsStep)
               localStorage.setItem("pendingMenu", JSON.stringify({ formData, generatedMenu, isFavorite }));
            } else {
               // Save directly
               setIsSaving(true);
               try {
                 const res = await fetch("/api/menus", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({
                     name: `Menu generated on ${new Date().toLocaleDateString()}`,
                     plannerState: formData,
                     generatedMenu,
                     isFavorite,
                   }),
                 });
                 if (res.ok) {
                   const data = await res.json();
                   setSavedMenuId(data.id);
                   setSaveSuccess(true);
                 }
               } catch (e) {
                 console.error(e);
               } finally {
                 setIsSaving(false);
               }
            }
          }}
          isFavorite={isFavorite}
          onFavoriteToggle={async () => {
            const newStatus = !isFavorite;
            setIsFavorite(newStatus);
            if (saveSuccess && savedMenuId) {
              try {
                await fetch(`/api/menus/${savedMenuId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isFavorite: newStatus }),
                });
              } catch (e) {
                console.error("Failed to update favorite status", e);
                setIsFavorite(!newStatus); // Revert on error
              }
            }
          }}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <FamilyStep
            formData={formData}
            updateForm={updateForm}
            updateKidsCount={updateKidsCount}
            updateKidAge={updateKidAge}
            totalServings={totalServings}
          />
        );
      case 2:
        return (
          <ScheduleStep formData={formData} toggleBusyDay={toggleBusyDay} updateForm={updateForm} />
        );
      case 3:
        return (
          <PreferencesStep
            formData={formData}
            toggleMeal={toggleMeal}
            toggleCuisine={toggleCuisine}
            toggleDiet={toggleDiet}
            updateForm={updateForm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#3A332C] selection:bg-[#EBE6DE] relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#F5F2EB] to-transparent -z-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#AF8F7C]/8 blur-[120px] -z-10" />
      <div className="absolute top-[30%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#8C7362]/5 blur-[100px] -z-10" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FDFBF7]/80 border-b border-[#EBE6DE]/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-[#3A332C] font-bold text-xl tracking-tight font-serif">
            <ChefHat size={24} className="text-[#AF8F7C]" />
            <span>MenuMagic</span>
          </Link>
          <Link href="/" className="text-sm text-[#7A7168] hover:text-[#3A332C] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-6 pt-12">
        <div className="flex items-center justify-between mb-12">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                  currentStep > step.id
                    ? "bg-[#AF8F7C] border-[#AF8F7C] text-white"
                    : currentStep === step.id
                    ? "border-[#AF8F7C] text-[#AF8F7C] bg-white shadow-lg shadow-[#AF8F7C]/20"
                    : "border-[#D4CEC6] text-[#D4CEC6]"
                }`}
              >
                {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
              </div>
              <span
                className={`ml-3 text-sm font-medium hidden sm:block transition-colors ${
                  currentStep >= step.id ? "text-[#3A332C]" : "text-[#B8B0A4]"
                }`}
              >
                {step.title}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors duration-500 ${
                    currentStep > step.id ? "bg-[#AF8F7C]" : "bg-[#EBE6DE]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-[2rem] border border-[#EBE6DE] p-8 sm:p-12 shadow-xl shadow-[#3A332C]/5 mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {!isComplete && (
          <div className="flex justify-between mb-16">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1 || isGenerating}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                currentStep === 1
                  ? "text-[#D4CEC6] cursor-not-allowed"
                  : "text-[#7A7168] hover:text-[#3A332C] hover:bg-white border border-[#EBE6DE]"
              }`}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={() => {
                if (currentStep === 3) {
                  handleGenerate();
                } else {
                  setCurrentStep((s) => s + 1);
                }
              }}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-[#AF8F7C] text-white px-8 py-3 rounded-full font-medium hover:bg-[#9A7B68] transition-all shadow-lg shadow-[#AF8F7C]/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 size={18} className="animate-spin" /> Generating...</>
              ) : currentStep === 3 ? (
                <><Sparkles size={18} /> Generate Menu</>
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 1: Family Composition
function FamilyStep({
  formData,
  updateForm,
  updateKidsCount,
  updateKidAge,
  totalServings,
}: {
  formData: PlannerState;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
  updateKidsCount: (count: number) => void;
  updateKidAge: (index: number, age: number) => void;
  totalServings: number;
}) {
  const ageGroups = [
    { label: "Toddler (1-3)", value: 2 },
    { label: "Young (4-8)", value: 5 },
    { label: "Pre-teen (9-12)", value: 10 },
    { label: "Teen (13+)", value: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Who&apos;s Eating?</h2>
        <p className="text-[#7A7168] font-light">Tell us about your family so we can plan the right portions.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#3A332C]">Adults</label>
          <div className="flex items-center gap-4 p-4 bg-[#FDFBF7] rounded-2xl border border-[#EBE6DE]">
            <button
              onClick={() => updateForm("adults", Math.max(1, formData.adults - 1))}
              className="w-10 h-10 rounded-full bg-white border border-[#EBE6DE] text-[#3A332C] hover:border-[#AF8F7C] transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-serif text-[#3A332C] w-12 text-center">{formData.adults}</span>
            <button
              onClick={() => updateForm("adults", formData.adults + 1)}
              className="w-10 h-10 rounded-full bg-white border border-[#EBE6DE] text-[#3A332C] hover:border-[#AF8F7C] transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#3A332C]">Children</label>
          <div className="flex items-center gap-4 p-4 bg-[#FDFBF7] rounded-2xl border border-[#EBE6DE]">
            <button
              onClick={() => updateKidsCount(Math.max(0, formData.kids - 1))}
              className="w-10 h-10 rounded-full bg-white border border-[#EBE6DE] text-[#3A332C] hover:border-[#AF8F7C] transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-serif text-[#3A332C] w-12 text-center">{formData.kids}</span>
            <button
              onClick={() => updateKidsCount(formData.kids + 1)}
              className="w-10 h-10 rounded-full bg-white border border-[#EBE6DE] text-[#3A332C] hover:border-[#AF8F7C] transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {formData.kids > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#3A332C]">Children&apos;s Ages</label>
          <div className="grid sm:grid-cols-2 gap-4">
            {formData.kidsAges.map((age, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-xl border border-[#EBE6DE]">
                <span className="text-sm text-[#7A7168] w-8">Child {idx + 1}</span>
                <select
                  value={age}
                  onChange={(e) => updateKidAge(idx, Number(e.target.value))}
                  className="flex-1 bg-white border border-[#EBE6DE] rounded-lg px-3 py-2 text-sm text-[#3A332C] focus:border-[#AF8F7C] focus:outline-none"
                >
                  {ageGroups.map((group) => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 bg-[#FDFBF7] rounded-2xl border border-[#EBE6DE]">
        <p className="text-sm text-[#7A7168]">
          <span className="font-medium text-[#3A332C]">Total servings per meal:</span>{" "}
          <span className="text-lg font-serif text-[#AF8F7C]">{totalServings}</span>
          {" "}({formData.adults} adult{formData.adults !== 1 ? "s" : ""}{formData.kids > 0 && ` + ${formData.kids} child${formData.kids !== 1 ? "ren" : ""}`})
        </p>
      </div>
    </div>
  );
}

// Step 2: Schedule
function ScheduleStep({
  formData,
  toggleBusyDay,
  updateForm,
}: {
  formData: PlannerState;
  toggleBusyDay: (day: string) => void;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
}) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Your Schedule</h2>
        <p className="text-[#7A7168] font-light">Which days are you too busy to cook?</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Busy Days</label>
        <div className="flex flex-wrap gap-3">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => toggleBusyDay(day)}
              className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                formData.busyDays.includes(day)
                  ? "bg-[#AF8F7C] text-white shadow-md shadow-[#AF8F7C]/20"
                  : "bg-white border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">
          Available cooking time on regular days
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[15, 30, 45, 60, 90].map((time) => (
            <button
              key={time}
              onClick={() => updateForm("cookingTime", time)}
              className={`p-4 rounded-2xl text-center transition-all ${
                formData.cookingTime === time
                  ? "bg-[#AF8F7C] text-white shadow-md shadow-[#AF8F7C]/20"
                  : "bg-white border border-[#EBE6DE] text-[#7A7168] hover:border-[#AF8F7C]/50"
              }`}
            >
              <span className="block text-lg font-serif">{time}</span>
              <span className="text-xs">min</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Preferences
function PreferencesStep({
  formData,
  toggleMeal,
  toggleCuisine,
  toggleDiet,
  updateForm,
}: {
  formData: PlannerState;
  toggleMeal: (meal: MealType) => void;
  toggleCuisine: (cuisine: CuisineType) => void;
  toggleDiet: (diet: string) => void;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
}) {
  const meals: { id: MealType; label: string }[] = [
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snacks", label: "Snacks" },
  ];

  const cuisines: { id: CuisineType; label: string }[] = [
    { id: "italian", label: "Italian" },
    { id: "mexican", label: "Mexican" },
    { id: "asian", label: "Asian" },
    { id: "american", label: "American" },
    { id: "mediterranean", label: "Mediterranean" },
    { id: "indian", label: "Indian" },
  ];

  const diets: { id: DietType; label: string }[] = [
    { id: "none", label: "No restrictions" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten-free", label: "Gluten-free" },
    { id: "keto", label: "Keto" },
    { id: "low-carb", label: "Low-carb" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Taste Preferences</h2>
        <p className="text-[#7A7168] font-light">What does your family love to eat?</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Meals to Plan</label>
        <div className="flex flex-wrap gap-3">
          {meals.map((meal) => (
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
          {cuisines.map((cuisine) => (
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
          {diets.map((diet) => (
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

// ─── Menu Generation Helpers ────────────────────────────────────────────────


// ─── Meal Detail Modal ───────────────────────────────────────────────────────

function MealModal({
  recipe,
  adults,
  onClose,
  sessionStatus,
  sourceMenuId,
  sourceDay,
  onRequestAuth,
}: {
  recipe: MealRecipe;
  adults: number;
  onClose: () => void;
  sessionStatus: string;
  sourceMenuId: string | null;
  sourceDay: string;
  onRequestAuth: () => void;
}) {
  const totalCalories = recipe.caloriesPerServing * adults;
  const totalProtein = recipe.protein * adults;
  const totalCarbs = recipe.carbs * adults;
  const totalFat = recipe.fat * adults;

  const [favId, setFavId] = useState<string | null>(null);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [favError, setFavError] = useState(false);

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

  const mealTypeIcons: Record<MealType, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snacks: "🍎",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3A332C]/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#EBE6DE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#EBE6DE] px-6 py-4 rounded-t-[2rem] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{mealTypeIcons[recipe.mealType]}</span>
              <span className="text-xs font-medium text-[#AF8F7C] uppercase tracking-wide">
                {recipe.mealType}
              </span>
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
          {/* Description */}
          <p className="text-[#7A7168] font-light leading-relaxed">{recipe.description}</p>

          {/* Time */}
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

          {/* Nutrition for Adults */}
          <div className="bg-[#FDFBF7] rounded-2xl p-4 border border-[#EBE6DE]">
            <p className="text-xs font-medium text-[#7A7168] uppercase tracking-wide mb-3">
              Nutrition for {adults} adult{adults !== 1 ? "s" : ""} ({recipe.caloriesPerServing} kcal / serving)
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Flame size={16} className="text-orange-400" />
                </div>
                <p className="text-lg font-serif text-[#3A332C]">{totalCalories}</p>
                <p className="text-xs text-[#7A7168]">kcal</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Dumbbell size={16} className="text-blue-400" />
                </div>
                <p className="text-lg font-serif text-[#3A332C]">{totalProtein}g</p>
                <p className="text-xs text-[#7A7168]">protein</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Wheat size={16} className="text-amber-400" />
                </div>
                <p className="text-lg font-serif text-[#3A332C]">{totalCarbs}g</p>
                <p className="text-xs text-[#7A7168]">carbs</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Droplets size={16} className="text-green-400" />
                </div>
                <p className="text-lg font-serif text-[#3A332C]">{totalFat}g</p>
                <p className="text-xs text-[#7A7168]">fat</p>
              </div>
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

// ─── Results Step ────────────────────────────────────────────────────────────

interface DragItem {
  day: string;
  mealType: string; // capitalised key as stored in meals record
}

function ResultsStep({
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
  onFavoriteToggle
}: {
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
}) {
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

  // Drag & Drop state
  const dragItem = useRef<DragItem | null>(null);
  const isDragging = useRef(false);
  const [dragOver, setDragOver] = useState<DragItem | null>(null);

  // Sort meals consistently
  const mealOrder: Record<MealType, number> = { breakfast: 0, lunch: 1, dinner: 2, snacks: 3 };
  const selectedMeals = [...(formData.meals as MealType[])].sort(
    (a, b) => mealOrder[a] - mealOrder[b]
  );

  const mealTypeIcons: Record<string, string> = {
    Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snacks: "🍎",
  };

  // A recipe is "complex" if total cook time exceeds the user's cooking time budget
  const isComplexRecipe = (recipe: Omit<MealRecipe, "mealType">) =>
    (recipe.prepTime + recipe.cookTime) > formData.cookingTime;

  // Keep a ref to always read the latest localMenu inside async callbacks
  const localMenuRef = useRef(localMenu);
  useEffect(() => { localMenuRef.current = localMenu; }, [localMenu]);

  // ── Swap logic ────────────────────────────────────────────────────────────
  const performSwap = async (src: DragItem, dest: DragItem) => {
    if (src.day === dest.day && src.mealType === dest.mealType) return;

    // Always derive from the latest snapshot via ref to avoid stale closures
    const updated: AIGeneratedMenu = JSON.parse(JSON.stringify(localMenuRef.current));

    const srcDayObj = updated.weeklyMenu.find((d) => d.day === src.day);
    const destDayObj = updated.weeklyMenu.find((d) => d.day === dest.day);
    if (!srcDayObj || !destDayObj) return;

    const srcMeal = srcDayObj.meals[src.mealType] ?? null;
    const destMeal = destDayObj.meals[dest.mealType] ?? null;

    if (srcMeal) {
      destDayObj.meals[dest.mealType] = srcMeal;
    } else {
      delete destDayObj.meals[dest.mealType];
    }
    if (destMeal) {
      srcDayObj.meals[src.mealType] = destMeal;
    } else {
      delete srcDayObj.meals[src.mealType];
    }

    // Update ref immediately so concurrent calls see the new value
    localMenuRef.current = updated;
    setLocalMenu(updated);
    onMenuSwap(updated);
    setSwapSuccess(true);
    setTimeout(() => setSwapSuccess(false), 2000);

    // Persist swap to DB if already saved
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

  // ── DnD handlers ──────────────────────────────────────────────────────────
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
    if (dragItem.current) {
      performSwap(dragItem.current, dest);
    }
    dragItem.current = null;
    setDragOver(null);
    // Reset flag here too — the dragged element may unmount during swap
    // (setLocalMenu triggers re-render), so dragend never fires on it.
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOver(null);
    // Delay clearing so the onClick that fires after dragend can check it
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
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
            {" · "}{formData.diets.map(d => d.replace("-", " ")).join(", ")}
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

        {/* Busy Days Banner – re-evaluates from localMenu whenever meals are swapped */}
        {(() => {
          if (formData.busyDays.length === 0) return null;
          const conflictingMeals: { day: string; name: string }[] = [];
          localMenu.weeklyMenu.forEach(({ day, meals }) => {
            if (!formData.busyDays.includes(day)) return;
            Object.values(meals).forEach((recipe) => {
              if (recipe && isComplexRecipe(recipe)) {
                conflictingMeals.push({ day, name: recipe.name });
              }
            });
          });
          if (conflictingMeals.length === 0) {
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
                <span className="font-semibold">{conflictingMeals.length} meal{conflictingMeals.length !== 1 ? "s" : ""} on busy days</span> exceed your {formData.cookingTime} min budget
                {" "}({conflictingMeals.map(m => `${m.day.slice(0, 3)}: ${m.name}`).join(" · ")}).
                {" "}Drag them to a free day to resolve.
              </span>
            </div>
          );
        })()}

        {/* ── Calendar Grid ───────────────────────────────────────────────── */}
        <div className="overflow-x-auto -mx-2 px-2">
          <div
            className="min-w-[560px]"
            style={{ display: "grid", gridTemplateColumns: `90px repeat(${selectedMeals.length}, 1fr)`, gap: "6px" }}
          >
            {/* Header Row – meal type columns */}
            <div className="sticky left-0" />{/* empty corner */}
            {selectedMeals.map((mealType) => {
              const name = mealType.charAt(0).toUpperCase() + mealType.slice(1);
              return (
                <div key={mealType} className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#FAF6F1] rounded-xl border border-[#EBE6DE] text-xs font-semibold text-[#7A7168] uppercase tracking-wide">
                  <span>{mealTypeIcons[name]}</span>
                  <span className="hidden sm:inline">{name}</span>
                </div>
              );
            })}

            {/* Day Rows */}
            {localMenu.weeklyMenu.map(({ day, meals }) => {
              const isBusy = formData.busyDays.includes(day);
              return [
                /* Day label cell */
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

                /* Meal cells for each meal type */
                ...selectedMeals.map((mealType) => {
                  const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                  const recipe = meals[mealName];
                  const isDragTarget =
                    dragOver?.day === day && dragOver?.mealType === mealName;
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
                          {/* Conflict badge */}
                          {isConflict && (
                            <span className="absolute top-1.5 right-1.5 text-amber-500" title={`${recipe.prepTime + recipe.cookTime} min total – exceeds your ${formData.cookingTime} min budget`}>
                              <AlertTriangle size={12} />
                            </span>
                          )}

                          {/* Drag handle */}
                          <div className="absolute top-1.5 left-1.5 text-[#C8C0B8] opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical size={12} />
                          </div>

                          {/* Time badge */}
                          <div className="flex items-center gap-1 mb-1.5 mt-0.5 pl-3">
                            <Timer size={10} className="text-[#AF8F7C]" />
                            <span className="text-[10px] text-[#AF8F7C]">{recipe.prepTime + recipe.cookTime}m</span>
                          </div>

                          {/* Recipe name */}
                          <p className="text-xs font-medium text-[#3A332C] leading-snug line-clamp-2 group-hover:text-[#AF8F7C] transition-colors">
                            {recipe.name}
                          </p>
                          <span className="text-[10px] text-[#B8B0A4] group-hover:text-[#AF8F7C] transition-colors mt-0.5 block">View recipe →</span>
                        </div>
                      ) : (
                        /* Empty drop zone */
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

        {/* Grocery List Section */}
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

      {/* Auth Modal for Saving */}
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
                <div className="flex-grow border-t border-[#EBE6DE]"></div>
                <span className="flex-shrink-0 mx-4 text-[#B8B0A4] text-sm">or</span>
                <div className="flex-grow border-t border-[#EBE6DE]"></div>
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
