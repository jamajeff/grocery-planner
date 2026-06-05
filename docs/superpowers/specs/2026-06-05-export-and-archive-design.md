# Grocery List Export & Week Archive — Design Spec

**Date:** 2026-06-05
**Status:** Approved design, pre-implementation
**Builds on:** [2026-06-04-weekly-grocery-planner-design.md](./2026-06-04-weekly-grocery-planner-design.md)

## Purpose

Two additions to the Weekly Grocery Planner:

1. **Export the grocery list as plain text** so it can be pasted into Apple
   Reminders or Apple Notes.
2. **Archive a week when shopping is done**, clearing the current week for a
   fresh one while keeping past weeks browsable and reusable.

## Core Decisions (locked)

1. **Two copy buttons.** "Copy for Reminders" produces a flat list (one item per
   line, name + quantity) so each line becomes its own reminder. "Copy for
   Notes" produces an aisle-grouped list with headers.
2. **Copy everything, plain.** Every grocery item is included — name + quantity
   only. No 🟡 flags, no notes, and the ephemeral "already have" checkbox state
   does not affect the copied text.
3. **Finish week archives + clears.** A "Finish week" action snapshots the
   current week into history (stamped with the finish date) and resets the
   current week to empty.
4. **History tab with restore.** A new "History" tab lists past weeks
   newest-first, each showing its meals and its (re-derived) grocery list, with
   a "Restore" button. Restoring into a non-empty current week prompts for
   confirmation first.

## Data Model

Add an `ArchivedWeek` and extend `PlannerState`:

```ts
interface ArchivedWeek {
  id: string;
  finishedAt: string;   // ISO timestamp, stamped at finish time
  week: WeekPlan;        // snapshot of meals + beverages at finish
}

interface PlannerState {
  library: Meal[];
  week: WeekPlan;
  pantry: PantryItem[];
  archive: ArchivedWeek[];   // NEW — newest first
}
```

- The grocery list is **never stored**. An archived week stores only its
  `WeekPlan` snapshot; its grocery list is re-derived via the existing
  `generateGroceryList` whenever it is viewed or restored.
- `loadState` defaults `archive` to `[]` when absent, so existing saved data
  (including other users' browsers) upgrades with nothing lost.

## Export Functions

New pure module `src/lib/exportList.ts`, operating on the existing
`GroceryListSection[]` already produced by `generateGroceryList`:

- `toRemindersText(sections): string` — flatten all items across all sections
  into one line each, `"<name> <qty>"`, no headers. Items keep aisle order then
  alphabetical (the order `generateGroceryList` already yields). Trailing
  newline omitted.
- `toNotesText(sections): string` — for each non-empty aisle: a capitalized
  header line, then `"- <name> <qty>"` per item, with a blank line between
  aisles.

Quantity formatting reuses the existing `fmtQty` rule: unit items render
`"<n> <unit>"` (e.g. `2 lb`); unitless items render just the number. Both
functions take the already-generated sections so they need no knowledge of the
week or pantry — easy to test in isolation.

## UI

**Grocery List tab** gains a button row above the list (only when the list is
non-empty):

- **Copy for Reminders** and **Copy for Notes** — each writes the corresponding
  text via `navigator.clipboard.writeText` and shows a transient "Copied!"
  confirmation. If the clipboard API rejects/absent, fall back to selecting the
  text in a textarea so the user can copy manually. Buttons carry aria-labels.
- **Finish week** — calls `finishWeek()`; disabled/hidden when the week is empty.

**History tab** (new, added to the nav after Pantry):

- Lists `archive` newest-first. Each entry shows the finish date, the meals in
  that week, and the re-derived grocery list (reusing the same rendering as the
  live list, read-only — no checkboxes).
- Each entry has a **Restore** button → `restoreWeek(id)`. If the current week
  is non-empty, confirm before replacing.
- Empty state: a short "No finished weeks yet" message.

## State Hook

`usePlannerState` gains:

- `finishWeek()` — if the current week has any meals or beverages, prepend
  `{ id, finishedAt: <now ISO>, week: <snapshot> }` to `archive` and reset
  `week` to `{ meals: [], beverages: [] }`. No-op on an empty week.
- `restoreWeek(id)` — replace the current `week` with the archived snapshot for
  that id (caller handles the confirm prompt). The archived entry remains in
  history.

## Error Handling

- Clipboard failure → textarea-select fallback; never throws to the user.
- `loadState` already guards corrupt JSON; the new `archive` default covers
  older shapes missing the field.
- `restoreWeek` with an unknown id is a no-op.

## Testing

- **`exportList.test.ts`** — `toRemindersText` / `toNotesText` over a fixture of
  sections: header presence, line format, quantity formatting (unit + unitless),
  aisle grouping/order, empty-list behavior.
- **`usePlannerState.test.tsx`** — `finishWeek` archives + clears and is a no-op
  when empty; `restoreWeek` replaces the current week and leaves history intact;
  unknown id is a no-op.
- **`storage.test.ts`** — loading state without `archive` yields `[]`.
- **Component tests** — copy buttons call the export functions / clipboard;
  History renders entries and Restore triggers the hook.
- **Live smoke test** — copy buttons populate the clipboard, Finish moves a week
  to History, Restore brings it back.

## Out of Scope (future)

- Copying a list directly from a History entry.
- Editing or deleting archived weeks.
- Sharing/exporting a specific person's list to another person.
