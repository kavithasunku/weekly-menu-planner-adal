"use client";

import { useState, useEffect } from "react";
import { ChefHat, ArrowRight, ArrowLeft, Users, Clock, Utensils, Check, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { UserMenu } from "@/components/auth/UserMenu";
import { PlannerState, MealType, CuisineType, AIGeneratedMenu } from "@/types/planner";
import { FamilyStep } from "@/components/planner/FamilyStep";
import { ScheduleStep } from "@/components/planner/ScheduleStep";
import { PreferencesStep } from "@/components/planner/PreferencesStep";
import { ResultsStep } from "@/components/planner/ResultsStep";

const STEPS = [
  { id: 1, title: "Family", icon: Users },
  { id: 2, title: "Schedule", icon: Clock },
  { id: 3, title: "Preferences", icon: Utensils },
];

const DEFAULT_FORM: PlannerState = {
  adults: 2,
  kids: 0,
  kidsAges: [],
  meals: ["dinner"],
  cuisines: [],
  diets: ["none"],
  busyDays: [],
  cookingTime: 30,
  notes: "",
};

export default function PlannerPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<{
    type: "rate_limit" | "sign_in_required" | "generic";
    message: string;
    resetAt?: Date | null;
    used?: number;
    limit?: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<AIGeneratedMenu | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savedMenuId, setSavedMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlannerState>(DEFAULT_FORM);

  // Restore pending menu from localStorage and auto-save when authenticated
  useEffect(() => {
    const pendingMenu = localStorage.getItem("pendingMenu");
    if (!pendingMenu) return;

    try {
      const menuData = JSON.parse(pendingMenu);

      if (!isComplete) {
        setFormData(menuData.formData);
        setGeneratedMenu(menuData.generatedMenu);
        setIsFavorite(menuData.isFavorite || false);
        setIsComplete(true);
        setCurrentStep(3);
      }

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
          .catch((e) => console.error("Auto-save failed", e))
          .finally(() => setIsSaving(false));
      }
    } catch (e) {
      console.error("Failed to parse pendingMenu", e);
    }
  }, [status, isComplete, isSaving, saveSuccess]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const updateForm = (field: keyof PlannerState, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateKidsCount = (newCount: number) => {
    const ages = [...formData.kidsAges];
    if (newCount > ages.length) {
      for (let i = ages.length; i < newCount; i++) ages.push(5);
    } else {
      ages.splice(newCount);
    }
    setFormData((prev) => ({ ...prev, kids: newCount, kidsAges: ages }));
  };

  const updateKidAge = (index: number, age: number) => {
    const ages = [...formData.kidsAges];
    ages[index] = age;
    setFormData((prev) => ({ ...prev, kidsAges: ages }));
  };

  const toggleMeal = (meal: MealType) => {
    const updated = formData.meals.includes(meal)
      ? formData.meals.filter((m) => m !== meal)
      : [...formData.meals, meal];
    updateForm("meals", updated);
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    const updated = formData.cuisines.includes(cuisine)
      ? formData.cuisines.filter((c) => c !== cuisine)
      : [...formData.cuisines, cuisine];
    updateForm("cuisines", updated);
  };

  const toggleBusyDay = (day: string) => {
    const updated = formData.busyDays.includes(day)
      ? formData.busyDays.filter((d) => d !== day)
      : [...formData.busyDays, day];
    updateForm("busyDays", updated);
  };

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

  // ── API calls ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.status === 429) {
        setGenerateError({
          type: "rate_limit",
          message: data.message || "Daily generation limit reached. Please try again tomorrow.",
          resetAt: data.resetAt ? new Date(data.resetAt) : null,
          used: data.used,
          limit: data.limit,
        });
        return;
      }
      if (res.status === 401 && data.type === "sign_in_required") {
        setGenerateError({
          type: "sign_in_required",
          message: data.message || "Sign in to generate more menus.",
        });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to generate menu");
      setGeneratedMenu(data);
      setIsComplete(true);
    } catch (error) {
      console.error(error);
      setGenerateError({ type: "generic", message: "Failed to generate menu. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveClick = async () => {
    if (status === "unauthenticated") {
      localStorage.setItem("pendingMenu", JSON.stringify({ formData, generatedMenu, isFavorite }));
      return;
    }
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
  };

  const handleFavoriteToggle = async () => {
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
        setIsFavorite(!newStatus);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const totalServings = formData.adults + formData.kids;

  const renderStep = () => {
    if (isComplete && generatedMenu) {
      return (
        <ResultsStep
          formData={formData}
          generatedMenu={generatedMenu}
          onMenuSwap={(updated) => setGeneratedMenu(updated)}
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
          onSaveClick={handleSaveClick}
          isFavorite={isFavorite}
          onFavoriteToggle={handleFavoriteToggle}
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
        return <ScheduleStep formData={formData} toggleBusyDay={toggleBusyDay} updateForm={updateForm} />;
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

  // Suppress unused variable warning for session
  void session;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#3A332C] selection:bg-[#EBE6DE] relative overflow-hidden">
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
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-[#7A7168] hover:text-[#3A332C] transition-colors">
              ← Back to Home
            </Link>
            <UserMenu />
          </div>
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

        {/* Rate Limit / Error Banner */}
        {generateError && (
          <div className={`rounded-2xl p-5 mb-6 flex items-start gap-4 border ${
            generateError.type === "sign_in_required"
              ? "bg-[#F9F5F0] border-[#AF8F7C] text-[#3A332C]"
              : generateError.type === "rate_limit"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <span className="text-2xl flex-shrink-0">
              {generateError.type === "sign_in_required" ? "✨" : generateError.type === "rate_limit" ? "⏳" : "⚠️"}
            </span>
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {generateError.type === "sign_in_required"
                  ? "Your free menu is ready!"
                  : generateError.type === "rate_limit"
                  ? "Daily limit reached"
                  : "Something went wrong"}
              </p>
              <p className="text-sm">{generateError.message}</p>
              {generateError.type === "rate_limit" && generateError.resetAt && (
                <p className="text-xs mt-2 opacity-70">
                  Resets at midnight · {generateError.used}/{generateError.limit} generations used today
                </p>
              )}
              {generateError.type === "sign_in_required" && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-3 bg-[#AF8F7C] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#9A7B68] transition-colors"
                >
                  Sign in for more →
                </Link>
              )}
            </div>
            <button
              onClick={() => setGenerateError(null)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}

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
                if (currentStep === 3) handleGenerate();
                else setCurrentStep((s) => s + 1);
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
