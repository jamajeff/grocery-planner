import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import { generateGroceryList } from "../lib/groceryList";
import { fmtQty } from "../lib/format";
import { toRemindersText, toNotesText } from "../lib/exportList";

type Props = { planner: ReturnType<typeof usePlannerState> };

export function GroceryList({ planner }: Props) {
  const sections = generateGroceryList(planner.state.week, planner.state.pantry);
  // "Already have" check state is intentionally ephemeral — it resets when leaving this tab.
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function toggle(key: string) {
    setHave((h) => ({ ...h, [key]: !h[key] }));
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: drop the text into a temporary textarea and select it.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* user can copy manually */
      }
      document.body.removeChild(ta);
    }
    setCopied(label);
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => copy("reminders", toRemindersText(sections))}
          className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          aria-label="Copy grocery list for Reminders"
        >
          {copied === "reminders" ? "Copied!" : "Copy for Reminders"}
        </button>
        <button
          onClick={() => copy("notes", toNotesText(sections))}
          className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          aria-label="Copy grocery list for Notes"
        >
          {copied === "notes" ? "Copied!" : "Copy for Notes"}
        </button>
        <button
          onClick={() => planner.finishWeek()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 ml-auto"
          aria-label="Finish this week and move it to history"
        >
          Finish week
        </button>
      </div>
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
