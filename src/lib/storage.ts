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

export function saveState(state: PlannerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
