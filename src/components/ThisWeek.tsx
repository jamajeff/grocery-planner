import { useState, useEffect } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import type { MealType } from "../lib/types";

function ServingsInput({
  value,
  label,
  onCommit,
}: {
  value: number;
  label: string;
  onCommit: (servings: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  return (
    <input
      type="number"
      min={1}
      value={draft}
      aria-label={label}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = Number(e.target.value);
        if (Number.isFinite(v) && v >= 1) onCommit(v);
      }}
      className="w-14 border rounded px-2 py-1"
    />
  );
}

type Props = {
  planner: ReturnType<typeof usePlannerState>;
  onShowGrocery: () => void;
};

const TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function ThisWeek({ planner, onShowGrocery }: Props) {
  const {
    state,
    addPlannedMeal,
    removePlannedMeal,
    updatePlannedMeal,
    addBeverage,
    removeBeverage,
    clearWeek,
  } = planner;
  const [bev, setBev] = useState("");
  const [pickId, setPickId] = useState("");

  function suggest(type: MealType) {
    const pool = state.library.filter((m) => m.type === type);
    if (pool.length === 0) return;
    // Index varies with current count so repeated clicks rotate choices.
    const pick = pool[state.week.meals.length % pool.length];
    addPlannedMeal(pick, 2, false);
  }

  function addSpecific() {
    const meal = state.library.find((m) => m.id === pickId);
    if (!meal) return;
    addPlannedMeal(meal, 2, false);
    setPickId("");
  }

  function submitBeverage(e: React.FormEvent) {
    e.preventDefault();
    const name = bev.trim();
    if (!name) return;
    addBeverage(name);
    setBev("");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">This Week</h2>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => suggest(t)}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm capitalize"
            >
              Suggest a {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="specific-meal" className="text-sm text-gray-600">
            …or add a specific meal:
          </label>
          <select
            id="specific-meal"
            aria-label="Add a specific meal"
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Choose a meal…</option>
            {state.library.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </select>
          <button
            onClick={addSpecific}
            disabled={!pickId}
            className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm disabled:opacity-40"
          >
            Add to week
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {state.week.meals.map((pm) => (
          <li key={pm.id} className="bg-white border rounded p-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="font-medium">{pm.meal.name}</span>
              <span className="ml-2 text-xs uppercase text-gray-500">{pm.meal.type}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1">
                Serves
                <ServingsInput
                  value={pm.servings}
                  label={`Servings for ${pm.meal.name}`}
                  onCommit={(servings) => updatePlannedMeal(pm.id, { servings })}
                />
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={pm.leftovers}
                  onChange={(e) => updatePlannedMeal(pm.id, { leftovers: e.target.checked })}
                  aria-label={`Leftovers for ${pm.meal.name}`}
                />
                Leftovers
              </label>
              <button onClick={() => removePlannedMeal(pm.id)} className="text-red-600">
                Remove
              </button>
            </div>
          </li>
        ))}
        {state.week.meals.length === 0 && (
          <li className="text-sm text-gray-500">No meals yet — suggest one above.</li>
        )}
      </ul>

      <div>
        <h3 className="font-semibold mb-2">Beverages</h3>
        <form onSubmit={submitBeverage} className="flex gap-2">
          <input
            value={bev}
            onChange={(e) => setBev(e.target.value)}
            placeholder="Add a beverage…"
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
            Add beverage
          </button>
        </form>
        <ul className="mt-2 flex flex-wrap gap-2">
          {state.week.beverages.map((b) => (
            <li key={b.id} className="bg-white border rounded px-2 py-1 text-sm flex items-center gap-2">
              {b.name}
              <button onClick={() => removeBeverage(b.id)} className="text-red-600" aria-label={`Remove ${b.name}`}>×</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onShowGrocery}
          className="px-4 py-2 rounded bg-emerald-700 text-white font-medium"
        >
          Generate Grocery List
        </button>
        <button onClick={clearWeek} className="px-4 py-2 rounded bg-gray-100 text-gray-700">
          Clear Week
        </button>
      </div>
    </section>
  );
}
