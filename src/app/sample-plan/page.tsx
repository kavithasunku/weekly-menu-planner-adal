import { ChefHat, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

const SAMPLE_MENU = {
  weeklyMenu: [
    {
      day: "Monday",
      meals: {
        Breakfast: { name: "Greek Yogurt Parfait", prepTime: 5, cookTime: 0, caloriesPerServing: 320, protein: 18, carbs: 38, fat: 8 },
        Lunch: { name: "Tuscan White Bean Soup", prepTime: 10, cookTime: 20, caloriesPerServing: 410, protein: 18, carbs: 52, fat: 12 },
        Dinner: { name: "Herb-Crusted Salmon & Roasted Asparagus", prepTime: 10, cookTime: 20, caloriesPerServing: 520, protein: 42, carbs: 14, fat: 28 },
      },
    },
    {
      day: "Tuesday",
      meals: {
        Breakfast: { name: "Avocado Toast with Poached Eggs", prepTime: 8, cookTime: 5, caloriesPerServing: 410, protein: 22, carbs: 34, fat: 20 },
        Lunch: { name: "Chicken Caesar Wrap", prepTime: 10, cookTime: 0, caloriesPerServing: 480, protein: 32, carbs: 42, fat: 16 },
        Dinner: { name: "Beef & Broccoli Stir-Fry", prepTime: 15, cookTime: 15, caloriesPerServing: 560, protein: 38, carbs: 28, fat: 26 },
      },
    },
    {
      day: "Wednesday",
      meals: {
        Breakfast: { name: "Overnight Oats with Berries", prepTime: 5, cookTime: 0, caloriesPerServing: 350, protein: 14, carbs: 58, fat: 8 },
        Lunch: { name: "Mediterranean Grain Bowl", prepTime: 10, cookTime: 0, caloriesPerServing: 450, protein: 16, carbs: 62, fat: 14 },
        Dinner: { name: "Lemon Garlic Chicken Thighs", prepTime: 10, cookTime: 25, caloriesPerServing: 490, protein: 44, carbs: 8, fat: 28 },
      },
    },
    {
      day: "Thursday",
      meals: {
        Breakfast: { name: "Spinach & Feta Omelette", prepTime: 5, cookTime: 8, caloriesPerServing: 380, protein: 26, carbs: 6, fat: 28 },
        Lunch: { name: "Shrimp Tacos with Mango Slaw", prepTime: 15, cookTime: 5, caloriesPerServing: 440, protein: 28, carbs: 46, fat: 14 },
        Dinner: { name: "Pasta Primavera", prepTime: 10, cookTime: 20, caloriesPerServing: 530, protein: 18, carbs: 74, fat: 16 },
      },
    },
    {
      day: "Friday",
      meals: {
        Breakfast: { name: "Banana Protein Smoothie", prepTime: 5, cookTime: 0, caloriesPerServing: 340, protein: 24, carbs: 48, fat: 6 },
        Lunch: { name: "Turkey & Brie Panini", prepTime: 8, cookTime: 5, caloriesPerServing: 510, protein: 34, carbs: 44, fat: 20 },
        Dinner: { name: "Sheet Pan Sausage & Veggies", prepTime: 10, cookTime: 30, caloriesPerServing: 548, protein: 30, carbs: 22, fat: 34 },
      },
    },
    {
      day: "Saturday",
      meals: {
        Breakfast: { name: "Fluffy Buttermilk Pancakes", prepTime: 10, cookTime: 15, caloriesPerServing: 460, protein: 12, carbs: 72, fat: 14 },
        Lunch: { name: "Caprese & Prosciutto Flatbread", prepTime: 10, cookTime: 10, caloriesPerServing: 490, protein: 22, carbs: 48, fat: 22 },
        Dinner: { name: "Slow-Cooked Moroccan Lamb Tagine", prepTime: 20, cookTime: 90, caloriesPerServing: 610, protein: 46, carbs: 32, fat: 30 },
      },
    },
    {
      day: "Sunday",
      meals: {
        Breakfast: { name: "Shakshuka with Crusty Bread", prepTime: 10, cookTime: 20, caloriesPerServing: 420, protein: 22, carbs: 36, fat: 20 },
        Lunch: { name: "French Onion Soup", prepTime: 10, cookTime: 40, caloriesPerServing: 380, protein: 14, carbs: 38, fat: 18 },
        Dinner: { name: "Classic Roast Chicken & Root Vegetables", prepTime: 15, cookTime: 75, caloriesPerServing: 580, protein: 52, carbs: 24, fat: 30 },
      },
    },
  ],
  groceryList: [
    {
      category: "Proteins",
      items: [
        { amount: "2 lbs", item: "salmon fillets" },
        { amount: "1.5 lbs", item: "chicken thighs" },
        { amount: "1 whole", item: "roasting chicken" },
        { amount: "1 lb", item: "beef strips" },
        { amount: "1 lb", item: "lamb shoulder" },
        { amount: "200g", item: "shrimp, peeled" },
        { amount: "200g", item: "prosciutto" },
        { amount: "4 links", item: "Italian sausage" },
        { amount: "8", item: "large eggs" },
      ],
    },
    {
      category: "Produce",
      items: [
        { amount: "1 bunch", item: "asparagus" },
        { amount: "2", item: "avocados" },
        { amount: "2 bags", item: "spinach" },
        { amount: "1 head", item: "broccoli" },
        { amount: "4 cloves", item: "garlic" },
        { amount: "2", item: "lemons" },
        { amount: "1", item: "mango" },
        { amount: "1 pint", item: "cherry tomatoes" },
        { amount: "2", item: "onions" },
        { amount: "3", item: "bell peppers" },
      ],
    },
    {
      category: "Dairy & Eggs",
      items: [
        { amount: "500g", item: "Greek yogurt" },
        { amount: "150g", item: "feta cheese" },
        { amount: "125g", item: "brie cheese" },
        { amount: "200ml", item: "buttermilk" },
        { amount: "200g", item: "mozzarella" },
        { amount: "100g", item: "parmesan" },
      ],
    },
    {
      category: "Grains & Pantry",
      items: [
        { amount: "400g", item: "pasta (penne)" },
        { amount: "200g", item: "rolled oats" },
        { amount: "1 can", item: "white beans" },
        { amount: "1 can", item: "crushed tomatoes" },
        { amount: "1 bag", item: "mixed grains (farro/quinoa)" },
        { amount: "6", item: "flour tortillas" },
        { amount: "4 slices", item: "sourdough bread" },
      ],
    },
    {
      category: "Herbs & Spices",
      items: [
        { amount: "1 bunch", item: "fresh parsley" },
        { amount: "1 bunch", item: "fresh thyme" },
        { amount: "1 bunch", item: "fresh rosemary" },
        { amount: "1 jar", item: "ras el hanout spice blend" },
        { amount: "1 jar", item: "cumin seeds" },
        { amount: "1 jar", item: "smoked paprika" },
      ],
    },
  ],
};

const MEALS = ["Breakfast", "Lunch", "Dinner"] as const;
const MEAL_ICONS: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
};

export default function SamplePlanPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#3A332C] selection:bg-[#EBE6DE] relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#F5F2EB] to-transparent -z-10" />
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#AF8F7C]/8 blur-[120px] -z-10" />
      <div className="absolute top-[30%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#8C7362]/5 blur-[100px] -z-10" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FDFBF7]/80 border-b border-[#EBE6DE]/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#3A332C] font-bold text-xl tracking-tight font-serif"
          >
            <ChefHat size={24} className="text-[#AF8F7C]" />
            <span>MenuMagic</span>
          </Link>
          <Link
            href="/planner"
            className="group flex items-center gap-2 bg-[#AF8F7C] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#9A7B68] transition-all shadow-md shadow-[#AF8F7C]/20"
          >
            Create My Menu
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#AF8F7C]/10 text-[#AF8F7C] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <CalendarDays size={13} />
            Sample Weekly Plan
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#3A332C] mb-4">
            Family of 4 · Mediterranean Mix
          </h1>
          <p className="text-[#7A7168] font-light max-w-xl mx-auto">
            2 adults · 2 kids · Balanced diet · 30 min avg cook time. This is what a generated plan looks like — yours will be tailored to your family&apos;s preferences.
          </p>
          <p className="text-xs text-[#AF8F7C] mt-3">Tap any meal card to see cook times & nutrition</p>
        </div>

        {/* Meal type legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {MEALS.map((meal) => (
            <span
              key={meal}
              className="px-4 py-2 bg-[#FDFBF7] rounded-full text-sm font-medium text-[#7A7168] border border-[#EBE6DE]"
            >
              {MEAL_ICONS[meal]} {meal}
            </span>
          ))}
        </div>

        {/* Weekly grid — one column per meal type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEALS.map((mealType) => (
            <div key={mealType} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EBE6DE]">
                <span className="text-xl">{MEAL_ICONS[mealType]}</span>
                <h2 className="text-lg font-serif text-[#3A332C]">{mealType}</h2>
              </div>
              <div className="space-y-2">
                {SAMPLE_MENU.weeklyMenu.map(({ day, meals }) => {
                  const recipe = meals[mealType as keyof typeof meals];
                  return (
                    <div
                      key={`${mealType}-${day}`}
                      className="group p-3 bg-[#FDFBF7] rounded-xl border border-[#EBE6DE] hover:border-[#AF8F7C]/50 hover:bg-[#FAF6F1] hover:shadow-md hover:shadow-[#AF8F7C]/10 transition-all cursor-default"
                    >
                      <span className="text-xs font-medium text-[#AF8F7C]">{day.slice(0, 3)}</span>
                      <p className="text-sm text-[#3A332C] leading-snug mt-0.5 font-medium">
                        {recipe.name}
                      </p>
                      <div className="flex gap-3 mt-1.5 text-xs text-[#B8B0A4]">
                        <span>{recipe.prepTime + recipe.cookTime} min</span>
                        <span>·</span>
                        <span>{recipe.caloriesPerServing} cal</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Grocery list */}
        <div className="p-6 bg-[#FDFBF7] rounded-2xl border border-[#EBE6DE]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🛒</span>
            <h2 className="text-lg font-serif text-[#3A332C]">Weekly Grocery List</h2>
            <span className="ml-auto text-xs text-[#B8B0A4]">Auto-generated from the plan above</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {SAMPLE_MENU.groceryList.map((group, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-[#EBE6DE]">
                <span className="text-xs font-semibold text-[#AF8F7C] uppercase tracking-wider">
                  {group.category}
                </span>
                <ul className="mt-2 space-y-1 text-[#7A7168]">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#AF8F7C] flex-shrink-0" />
                      <span className="font-medium text-[#3A332C]">{item.amount}</span> {item.item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-[#7A7168] mb-6 font-light">
            Ready for a menu that&apos;s built around <em>your</em> family?
          </p>
          <Link
            href="/planner"
            className="group inline-flex items-center gap-3 bg-[#AF8F7C] text-white px-10 py-4 rounded-full font-medium text-lg hover:bg-[#9A7B68] transition-all shadow-xl shadow-[#AF8F7C]/20"
          >
            Create My Personalised Menu
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
    </div>
  );
}
