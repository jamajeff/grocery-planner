# Grocery List Export & Week Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add plain-text export of the grocery list (Reminders + Notes formats) and the ability to finish a week into a browsable, restorable history.

**Architecture:** Extend `PlannerState` with an `archive: ArchivedWeek[]`. Add pure text-formatting functions that consume the existing `GroceryListSection[]`. Add `finishWeek`/`restoreWeek` to the state hook. Add copy + finish buttons to the Grocery List tab and a new History tab. The grocery list is never stored — archived weeks keep only their `WeekPlan` snapshot and re-derive the list on view/restore.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-05-export-and-archive-design.md`

---

### Task 1: Data model + storage default

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: Add the `ArchivedWeek` type**

In `src/lib/types.ts`, after the `WeekPlan` interface, add:

```ts
/** A finished week, snapshotted into history. */
export interface ArchivedWeek {
  id: string;
  finishedAt: string; // ISO timestamp stamped at finish time
  week: WeekPlan;
}
```

- [ ] **Step 2: Add `archive` to `PlannerState` and default it on load**

In `src/lib/storage.ts`, update the interface and `loadState`:

```ts
import type { Meal, WeekPlan, PantryItem, ArchivedWeek } from "./types";

export interface PlannerState {
  library: Meal[];
  week: WeekPlan;
  pantry: PantryItem[];
  archive: ArchivedWeek[];
}

export const STORAGE_KEY = "grocery-planner:v1";

export function loadState(): PlannerState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as PlannerState;
    // Older saved data predates `archive`; default it so nothing breaks.
    return { ...parsed, archive: parsed.archive ?? [] };
  } catch {
    return null;
  }
}
```

(`saveState` is unchanged.)

- [ ] **Step 3: Write the failing test for the archive default**

In `src/lib/storage.test.ts`, add `archive: []` to the `sample` fixture, then add:

```ts
it("defaults archive to [] when missing from stored data", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ library: [], week: { meals: [], beverages: [] }, pantry: [] }),
  );
  expect(loadState()?.archive).toEqual([]);
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS (round-trip test still passes with `archive: []` in the fixture; new test passes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add ArchivedWeek type and archive field with load default"
```

---

### Task 2: Quantity formatter + export functions

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/exportList.ts`
- Create: `src/lib/exportList.test.ts`
- Modify: `src/components/GroceryList.tsx` (use shared `fmtQty`)

- [ ] **Step 1: Extract the shared quantity formatter**

Create `src/lib/format.ts`:

```ts
/** Render a quantity for display: "2 lb", or just "2" for unitless items. */
export function fmtQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}
```

Then in `src/components/GroceryList.tsx`, delete the local `fmtQty` function and import it instead:

```ts
import { fmtQty } from "../lib/format";
```

- [ ] **Step 2: Write the failing export tests**

Create `src/lib/exportList.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toRemindersText, toNotesText } from "./exportList";
import type { GroceryListSection } from "./types";

const sections: GroceryListSection[] = [
  {
    aisle: "produce",
    items: [
      { name: "Onion", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable", mayAlreadyHave: false },
      { name: "Tomato", quantity: 3, unit: "", aisle: "produce", shelfLife: "perishable", mayAlreadyHave: false },
    ],
  },
  {
    aisle: "meat",
    items: [
      { name: "Chicken breast", quantity: 2, unit: "lb", aisle: "meat", shelfLife: "perishable", mayAlreadyHave: false },
    ],
  },
];

describe("toRemindersText", () => {
  it("renders one item per line with quantity, no headers", () => {
    expect(toRemindersText(sections)).toBe("Onion 2\nTomato 3\nChicken breast 2 lb");
  });

  it("returns empty string for no sections", () => {
    expect(toRemindersText([])).toBe("");
  });
});

describe("toNotesText", () => {
  it("groups items under capitalized aisle headers with blank lines between", () => {
    expect(toNotesText(sections)).toBe(
      "Produce\n- Onion 2\n- Tomato 3\n\nMeat\n- Chicken breast 2 lb",
    );
  });

  it("returns empty string for no sections", () => {
    expect(toNotesText([])).toBe("");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/exportList.test.ts`
Expected: FAIL with "toRemindersText is not a function" / module not found.

- [ ] **Step 4: Implement the export functions**

Create `src/lib/exportList.ts`:

```ts
import { fmtQty } from "./format";
import type { GroceryListSection } from "./types";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Flat list, one item per line ("<name> <qty>"), no headers. */
export function toRemindersText(sections: GroceryListSection[]): string {
  return sections
    .flatMap((s) => s.items.map((i) => `${i.name} ${fmtQty(i.quantity, i.unit)}`))
    .join("\n");
}

/** Aisle headers, each followed by "- <name> <qty>" lines, blank line between aisles. */
export function toNotesText(sections: GroceryListSection[]): string {
  return sections
    .map((s) => [cap(s.aisle), ...s.items.map((i) => `- ${i.name} ${fmtQty(i.quantity, i.unit)}`)].join("\n"))
    .join("\n\n");
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/exportList.test.ts src/components/GroceryList.test.tsx`
Expected: PASS (export tests pass; GroceryList still passes with the imported `fmtQty`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts src/lib/exportList.ts src/lib/exportList.test.ts src/components/GroceryList.tsx
git commit -m "feat: add grocery list text export (reminders + notes formats)"
```

---

### Task 3: finishWeek + restoreWeek state hook methods

**Files:**
- Modify: `src/hooks/usePlannerState.ts`
- Test: `src/hooks/usePlannerState.test.tsx`

- [ ] **Step 1: Implement the hook methods**

In `src/hooks/usePlannerState.ts`:

- Update the initial state in `initialState()` to include `archive: []`:

```ts
function initialState(): PlannerState {
  return loadState() ?? {
    library: SEED_MEALS,
    week: { meals: [], beverages: [] },
    pantry: STAPLE_PANTRY,
    archive: [],
  };
}
```

- Add these two functions before the `return`:

```ts
function finishWeek() {
  setState((s) => {
    if (s.week.meals.length === 0 && s.week.beverages.length === 0) return s;
    const archived = {
      id: makeId(),
      finishedAt: new Date().toISOString(),
      week: s.week,
    };
    return {
      ...s,
      week: { meals: [], beverages: [] },
      archive: [archived, ...s.archive],
    };
  });
}

function restoreWeek(id: string) {
  setState((s) => {
    const found = s.archive.find((a) => a.id === id);
    if (!found) return s;
    return { ...s, week: found.week };
  });
}
```

- Add `finishWeek` and `restoreWeek` to the returned object.

- [ ] **Step 2: Write the failing tests**

In `src/hooks/usePlannerState.test.tsx`, add:

```ts
it("finishWeek archives the current week and clears it", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
  act(() => result.current.finishWeek());
  expect(result.current.state.week.meals).toEqual([]);
  expect(result.current.state.archive.length).toBe(1);
  expect(result.current.state.archive[0].week.meals.length).toBe(1);
  expect(result.current.state.archive[0].finishedAt).toBeTruthy();
});

it("finishWeek is a no-op on an empty week", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.finishWeek());
  expect(result.current.state.archive.length).toBe(0);
});

it("restoreWeek replaces the current week and leaves history intact", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
  act(() => result.current.finishWeek());
  const id = result.current.state.archive[0].id;
  act(() => result.current.restoreWeek(id));
  expect(result.current.state.week.meals.length).toBe(1);
  expect(result.current.state.archive.length).toBe(1);
});

it("restoreWeek with an unknown id is a no-op", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.restoreWeek("nope"));
  expect(result.current.state.week.meals).toEqual([]);
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/hooks/usePlannerState.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePlannerState.ts src/hooks/usePlannerState.test.tsx
git commit -m "feat: add finishWeek and restoreWeek to planner state hook"
```

---

### Task 4: Copy + Finish buttons on the Grocery List tab

**Files:**
- Modify: `src/components/GroceryList.tsx`
- Test: `src/components/GroceryList.test.tsx`

- [ ] **Step 1: Add the button row and clipboard logic**

In `src/components/GroceryList.tsx`:

- Import the export functions and `useState` (already imported):

```ts
import { toRemindersText, toNotesText } from "../lib/exportList";
```

- Inside the component, add copy state + handler (place near the existing `have` state):

```ts
const [copied, setCopied] = useState<string | null>(null);

async function copy(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback: drop the text into a temporary textarea and select it.
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* user can copy manually */ }
    document.body.removeChild(ta);
  }
  setCopied(label);
}
```

- In the non-empty render branch, add a button row directly under the `<h2>`:

```tsx
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
```

- [ ] **Step 2: Write the failing test**

In `src/components/GroceryList.test.tsx`, add a test that the copy button writes to the clipboard. Mock the clipboard in the test:

```ts
it("copies the reminders-format list to the clipboard", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  // render with a planner that has at least one planned meal, then:
  await userEvent.click(screen.getByRole("button", { name: /copy grocery list for reminders/i }));
  expect(writeText).toHaveBeenCalled();
});
```

Follow the existing setup pattern already used in `GroceryList.test.tsx` for building a planner with a meal (reuse its render helper / fixture; import `vi`, `userEvent`, `screen` as the other tests in this file do).

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/GroceryList.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/GroceryList.tsx src/components/GroceryList.test.tsx
git commit -m "feat: add copy and finish-week buttons to grocery list"
```

---

### Task 5: History tab

**Files:**
- Create: `src/components/History.tsx`
- Create: `src/components/History.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/History.test.tsx`:

```ts
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { History } from "./History";
import { usePlannerState } from "../hooks/usePlannerState";
import { SEED_MEALS } from "../data/seedMeals";

describe("History", () => {
  it("shows an empty state when there are no archived weeks", () => {
    const { result } = renderHook(() => usePlannerState());
    render(<History planner={result.current} />);
    expect(screen.getByText(/no finished weeks yet/i)).toBeInTheDocument();
  });

  it("lists archived weeks and restores one on click", async () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    act(() => result.current.finishWeek());
    render(<History planner={result.current} />);
    await userEvent.click(screen.getByRole("button", { name: /restore/i }));
    expect(result.current.state.week.meals.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/History.test.tsx`
Expected: FAIL — module `./History` not found.

- [ ] **Step 3: Implement the History component**

Create `src/components/History.tsx`:

```tsx
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
```

- [ ] **Step 4: Wire the History tab into the nav**

In `src/App.tsx`:

```ts
import { History } from "./components/History";

type Tab = "week" | "grocery" | "library" | "pantry" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "This Week" },
  { id: "grocery", label: "Grocery List" },
  { id: "library", label: "Meal Library" },
  { id: "pantry", label: "Pantry" },
  { id: "history", label: "History" },
];
```

And in the `<main>`, add:

```tsx
{tab === "history" && <History planner={planner} />}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/components/History.test.tsx`
Expected: PASS.

- [ ] **Step 6: Full suite + build**

Run: `npx vitest run && npm run build`
Expected: all tests PASS, build clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/History.tsx src/components/History.test.tsx src/App.tsx
git commit -m "feat: add History tab with browse and restore"
```

---

## Self-Review

**Spec coverage:**
- Two copy buttons (Reminders flat / Notes grouped) → Task 2 (functions) + Task 4 (buttons). ✓
- Copy everything, plain, name + qty → Task 2 export functions use no flags. ✓
- Finish week archives + clears → Task 3 `finishWeek` + Task 4 button. ✓
- History tab, newest-first, meals + re-derived list, restore w/ confirm → Task 5. ✓
- `archive` defaults to `[]` for old data → Task 1. ✓
- Clipboard fallback → Task 4 `copy()` try/catch. ✓
- Tests for export, hook, storage, components → Tasks 1–5. ✓

**Placeholder scan:** Task 4 Step 2 references the file's existing render helper rather than repeating it — acceptable since it's an existing in-file pattern, not undefined new code.

**Type consistency:** `finishWeek`/`restoreWeek`, `ArchivedWeek`, `archive`, `fmtQty`, `toRemindersText`/`toNotesText` used consistently across tasks. ✓
