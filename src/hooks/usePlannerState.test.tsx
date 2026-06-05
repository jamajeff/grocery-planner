import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "./usePlannerState";
import { STORAGE_KEY } from "../lib/storage";
import { SEED_MEALS } from "../data/seedMeals";

describe("usePlannerState", () => {
  beforeEach(() => localStorage.clear());

  it("seeds the library and staples on first run", () => {
    const { result } = renderHook(() => usePlannerState());
    expect(result.current.state.library.length).toBe(SEED_MEALS.length);
    expect(result.current.state.pantry.length).toBeGreaterThan(0);
    expect(result.current.state.week.meals).toEqual([]);
  });

  it("adds a planned meal from the library", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    expect(result.current.state.week.meals.length).toBe(1);
    expect(result.current.state.week.meals[0].meal.name).toBe(SEED_MEALS[0].name);
  });

  it("persists changes to localStorage", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addBeverage("Coffee"));
    expect(localStorage.getItem(STORAGE_KEY)).toContain("Coffee");
  });

  it("removes a planned meal by id", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    const id = result.current.state.week.meals[0].id;
    act(() => result.current.removePlannedMeal(id));
    expect(result.current.state.week.meals.length).toBe(0);
  });

  it("updates servings and leftovers on a planned meal", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    const id = result.current.state.week.meals[0].id;
    act(() => result.current.updatePlannedMeal(id, { servings: 4, leftovers: true }));
    const pm = result.current.state.week.meals[0];
    expect(pm.servings).toBe(4);
    expect(pm.leftovers).toBe(true);
  });

  it("adds and removes pantry items", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPantryItem("Rice"));
    const item = result.current.state.pantry.find((p) => p.name === "Rice")!;
    expect(item).toBeTruthy();
    act(() => result.current.removePantryItem(item.id));
    expect(result.current.state.pantry.find((p) => p.name === "Rice")).toBeUndefined();
  });

  it("adds a custom meal to the library", () => {
    const { result } = renderHook(() => usePlannerState());
    const before = result.current.state.library.length;
    act(() => result.current.addCustomMeal({ name: "Test Meal", type: "dinner", ingredients: [] }));
    expect(result.current.state.library.length).toBe(before + 1);
    const added = result.current.state.library.at(-1)!;
    expect(added.name).toBe("Test Meal");
    expect(added.id).toBeTruthy();
  });

  it("clears the week's meals and beverages", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => {
      result.current.addPlannedMeal(result.current.state.library[0], 2, false);
      result.current.addBeverage("Coffee");
    });
    act(() => result.current.clearWeek());
    expect(result.current.state.week.meals).toEqual([]);
    expect(result.current.state.week.beverages).toEqual([]);
  });

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

  it("adds and removes beverages", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addBeverage("Coffee"));
    const bev = result.current.state.week.beverages.find((b) => b.name === "Coffee")!;
    expect(bev).toBeTruthy();
    act(() => result.current.removeBeverage(bev.id));
    expect(result.current.state.week.beverages.find((b) => b.name === "Coffee")).toBeUndefined();
  });
});
