import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import { generateGroceryList } from "../lib/groceryList";

type Props = { planner: ReturnType<typeof usePlannerState> };

function fmtQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

export function GroceryList({ planner }: Props) {
  const sections = generateGroceryList(planner.state.week, planner.state.pantry);
  // "Already have" check state is intentionally ephemeral — it resets when leaving this tab.
  const [have, setHave] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setHave((h) => ({ ...h, [key]: !h[key] }));
  }

  if (planner.state.week.meals.length === 0 && planner.state.week.beverages.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Grocery List</h2>
        <p className="text-sm text-gray-500">No meals planned yet. Add some on the This Week tab.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Grocery List</h2>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.aisle}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 capitalize">
              {section.aisle}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const key = `${section.aisle}:${item.name.toLowerCase()}:${item.unit.toLowerCase()}`;
                const checked = !!have[key];
                return (
                  <li
                    key={key}
                    className={`bg-white border rounded px-3 py-2 flex items-start gap-3 ${
                      checked ? "line-through text-gray-400" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(key)}
                      className="mt-1"
                      aria-label={`Already have ${item.name}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">{fmtQty(item.quantity, item.unit)}</span>
                      </div>
                      {item.mayAlreadyHave && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          🟡 You may already have this — check before buying.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
