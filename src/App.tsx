import { useState } from "react";
import { usePlannerState } from "./hooks/usePlannerState";
import { ThisWeek } from "./components/ThisWeek";
import { GroceryList } from "./components/GroceryList";
import { MealLibrary } from "./components/MealLibrary";
import { Pantry } from "./components/Pantry";

type Tab = "week" | "grocery" | "library" | "pantry";

const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "This Week" },
  { id: "grocery", label: "Grocery List" },
  { id: "library", label: "Meal Library" },
  { id: "pantry", label: "Pantry" },
];

export default function App() {
  const planner = usePlannerState();
  const [tab, setTab] = useState<Tab>("week");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Weekly Grocery Planner</h1>
          <nav className="mt-3 flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  tab === t.id
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === "week" && <ThisWeek planner={planner} onShowGrocery={() => setTab("grocery")} />}
        {tab === "grocery" && <GroceryList planner={planner} />}
        {tab === "library" && <MealLibrary planner={planner} />}
        {tab === "pantry" && <Pantry planner={planner} />}
      </main>
    </div>
  );
}
