import { useEffect, useRef, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import type { PlannerState } from "../lib/storage";
import { SEED_MEALS } from "../data/seedMeals";
import { STAPLE_PANTRY } from "../data/staples";
import { makeId } from "../lib/id";
import type { Meal, PlannedMeal } from "../lib/types";

function initialState(): PlannerState {
  return loadState() ?? {
    library: SEED_MEALS,
    week: { meals: [], beverages: [] },
    pantry: STAPLE_PANTRY,
  };
}

export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(initialState);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  function addPlannedMeal(meal: Meal, servings: number, leftovers: boolean) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        meals: [...s.week.meals, { id: makeId(), meal, servings, leftovers }],
      },
    }));
  }

  function removePlannedMeal(id: string) {
    setState((s) => ({
      ...s,
      week: { ...s.week, meals: s.week.meals.filter((m) => m.id !== id) },
    }));
  }

  function updatePlannedMeal(
    id: string,
    patch: Partial<Pick<PlannedMeal, "servings" | "leftovers">>,
  ) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        meals: s.week.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      },
    }));
  }

  function addBeverage(name: string) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        beverages: [...s.week.beverages, { id: makeId(), name }],
      },
    }));
  }

  function removeBeverage(id: string) {
    setState((s) => ({
      ...s,
      week: { ...s.week, beverages: s.week.beverages.filter((b) => b.id !== id) },
    }));
  }

  function addCustomMeal(meal: Omit<Meal, "id">) {
    setState((s) => ({
      ...s,
      library: [...s.library, { ...meal, id: makeId() }],
    }));
  }

  function addPantryItem(name: string) {
    setState((s) => ({
      ...s,
      pantry: [...s.pantry, { id: makeId(), name }],
    }));
  }

  function removePantryItem(id: string) {
    setState((s) => ({
      ...s,
      pantry: s.pantry.filter((p) => p.id !== id),
    }));
  }

  function clearWeek() {
    setState((s) => ({ ...s, week: { meals: [], beverages: [] } }));
  }

  return {
    state,
    addPlannedMeal,
    removePlannedMeal,
    updatePlannedMeal,
    addBeverage,
    removeBeverage,
    addCustomMeal,
    addPantryItem,
    removePantryItem,
    clearWeek,
  };
}
