import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";

type Props = { planner: ReturnType<typeof usePlannerState> };

export function Pantry({ planner }: Props) {
  const { state, addPantryItem, removePantryItem } = planner;
  const [name, setName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addPantryItem(n);
    setName("");
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">Pantry</h2>
      <p className="text-sm text-gray-600 mb-4">
        Things you already own. Long-lasting items on your grocery list get a
        "check before buying" flag automatically; add anything else here.
      </p>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
          Add to pantry
        </button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {state.pantry.map((p) => (
          <li key={p.id} className="bg-white border rounded px-2 py-1 text-sm flex items-center gap-2">
            {p.name}
            <button onClick={() => removePantryItem(p.id)} className="text-red-600" aria-label={`Remove ${p.name} from pantry`}>×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
