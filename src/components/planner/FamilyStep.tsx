"use client";

import { PlannerState } from "@/types/planner";

const AGE_GROUPS = [
  { label: "Toddler (1-3)", value: 2 },
  { label: "Young (4-8)", value: 5 },
  { label: "Pre-teen (9-12)", value: 10 },
  { label: "Teen (13+)", value: 15 },
];

interface Props {
  formData: PlannerState;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
  updateKidsCount: (count: number) => void;
  updateKidAge: (index: number, age: number) => void;
  totalServings: number;
}

export function FamilyStep({ formData, updateForm, updateKidsCount, updateKidAge, totalServings }: Props) {
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
                  {AGE_GROUPS.map((group) => (
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
          {" "}({formData.adults} adult{formData.adults !== 1 ? "s" : ""}
          {formData.kids > 0 && ` + ${formData.kids} child${formData.kids !== 1 ? "ren" : ""}`})
        </p>
      </div>
    </div>
  );
}
