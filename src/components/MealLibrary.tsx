import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import type { Aisle, MealType } from "../lib/types";
import { guessAisle } from "../lib/categorize";

type Props = { planner: ReturnType<typeof usePlannerState> };

type DraftIngredient = { name: string; aisle: Aisle };

const TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const AISLES: Aisle[] = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "beverages",
  "other",
];

export function MealLibrary({ planner }: Props) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("dinner");
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  const meals = planner.state.library.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  function addIngredient() {
    const ingName = ingredient.trim();
    if (!ingName) return;
    setIngredients((list) => [...list, { name: ingName, aisle: guessAisle(ingName) }]);
    setIngredient("");
  }

  function setIngredientAisle(index: number, aisle: Aisle) {
    setIngredients((list) => list.map((ing, i) => (i === index ? { ...ing, aisle } : ing)));
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
      // Aisle is auto-detected then user-editable; quantity/unit/shelfLife keep
      // safe defaults and can be refined later.
      ingredients: ingredients.map((ing) => ({
        name: ing.name,
        quantity: 1,
        unit: "",
        aisle: ing.aisle,
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
                  <li key={i} className="flex justify-between items-center gap-2 bg-gray-50 border rounded px-3 py-1.5 text-sm">
                    <span className="flex-1 truncate">{ing.name}</span>
                    <select
                      value={ing.aisle}
                      onChange={(e) => setIngredientAisle(i, e.target.value as Aisle)}
                      aria-label={`Aisle for ${ing.name}`}
                      className="border rounded px-1.5 py-1 text-xs capitalize bg-white"
                    >
                      {AISLES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      aria-label={`Remove ${ing.name}`}
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
