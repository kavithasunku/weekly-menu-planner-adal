"use client";

import { PlannerState } from "@/types/planner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COOKING_TIMES = [15, 30, 45, 60, 90];

interface Props {
  formData: PlannerState;
  toggleBusyDay: (day: string) => void;
  updateForm: (field: keyof PlannerState, value: unknown) => void;
}

export function ScheduleStep({ formData, toggleBusyDay, updateForm }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#3A332C] mb-3">Your Schedule</h2>
        <p className="text-[#7A7168] font-light">Which days are you too busy to cook?</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#3A332C]">Busy Days</label>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => (
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
          {COOKING_TIMES.map((time) => (
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
