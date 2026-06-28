import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import type { MealType } from "../lib/types";

type Props = { planner: ReturnType<typeof usePlannerState> };

const TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function MealLibrary({ planner }: Props) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("dinner");
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);

  const meals = planner.state.library.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  function addIngredient() {
    const ingName = ingredient.trim();
    if (!ingName) return;
    setIngredients((list) => [...list, ingName]);
    setIngredient("");
  }

  function removeIngredient(index: number) {
    setIngredients((list) => list.filter((_, i) => i !== index));
  }

  function saveMeal(e: React.FormEvent) {
    e.preventDefault();
    const mealName = name.trim();
    if (!mealName || ingredients.length === 0) return;
    planner.addCustomMeal({
      name: mealName,
      type,
      // Custom meals capture names only; quantity/unit/aisle use safe defaults
      // and can be edited later.
      ingredients: ingredients.map((ingName) => ({
        name: ingName,
        quantity: 1,
        unit: "",
        aisle: "other",
        shelfLife: "perishable",
      })),
    });
    setName("");
    setIngredient("");
    setIngredients([]);
    setType("dinner");
    setShowForm(false);
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Meal Library</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm"
        >
          {showForm ? "Cancel" : "Add your own meal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveMeal} className="bg-white border rounded p-3 mb-4 space-y-3">
          <div>
            <label htmlFor="meal-name" className="block text-sm font-medium mb-1">Meal name</label>
            <input
              id="meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="meal-type" className="block text-sm font-medium mb-1">Type</label>
            <select
              id="meal-type"
              value={type}
              onChange={(e) => setType(e.target.value as MealType)}
              className="border rounded px-2 py-1.5 capitalize"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="meal-ingredient" className="block text-sm font-medium mb-1">Ingredient</label>
            <div className="flex gap-2">
              <input
                id="meal-ingredient"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-2 rounded bg-emerald-600 text-white text-sm whitespace-nowrap"
              >
                Add ingredient
              </button>
            </div>
            {ingredients.length > 0 && (
              <ul className="mt-2 space-y-1">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between items-center bg-gray-50 border rounded px-3 py-1.5 text-sm">
                    <span>{ing}</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      aria-label={`Remove ${ing}`}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
            Save meal
          </button>
        </form>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meals…"
        aria-label="Search meals"
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <ul className="space-y-3">
        {meals.map((m) => (
          <li key={m.id} className="bg-white border rounded p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{m.name}</span>
              <span className="text-xs uppercase text-gray-500">{m.type}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {m.ingredients.map((i) => i.name).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
