import type { Meal, WeekPlan, PantryItem } from "./types";

export interface PlannerState {
  library: Meal[];
  week: WeekPlan;
  pantry: PantryItem[];
}

export const STORAGE_KEY = "grocery-planner:v1";

export function loadState(): PlannerState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as PlannerState;
  } catch {
    return null;
  }
}

export function saveState(state: PlannerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
