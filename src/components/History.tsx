import type { usePlannerState } from "../hooks/usePlannerState";
import { generateGroceryList } from "../lib/groceryList";
import { fmtQty } from "../lib/format";

type Props = { planner: ReturnType<typeof usePlannerState> };

export function History({ planner }: Props) {
  const { archive } = planner.state;

  function restore(id: string) {
    const hasCurrent =
      planner.state.week.meals.length > 0 || planner.state.week.beverages.length > 0;
    if (hasCurrent && !window.confirm("Replace the current week with this one?")) return;
    planner.restoreWeek(id);
  }

  if (archive.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">History</h2>
        <p className="text-sm text-gray-500">No finished weeks yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">History</h2>
      <div className="space-y-6">
        {archive.map((a) => {
          const sections = generateGroceryList(a.week, planner.state.pantry);
          const date = new Date(a.finishedAt).toLocaleDateString();
          return (
            <div key={a.id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Week finished {date}</h3>
                <button
                  onClick={() => restore(a.id)}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  aria-label={`Restore week finished ${date}`}
                >
                  Restore
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {a.week.meals.map((m) => m.meal.name).join(", ") || "No meals"}
              </p>
              <div className="space-y-2">
                {sections.map((s) => (
                  <div key={s.aisle}>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 capitalize">
                      {s.aisle}
                    </h4>
                    <ul className="text-sm text-gray-700">
                      {s.items.map((i) => (
                        <li key={`${i.name}:${i.unit}`}>
                          {i.name} — {fmtQty(i.quantity, i.unit)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
