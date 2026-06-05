import { it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { ThisWeek } from "./ThisWeek";

beforeEach(() => localStorage.clear());

it("suggests a dinner and adds it to the week", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const onShow = vi.fn();
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={onShow} />);
  await userEvent.click(screen.getByRole("button", { name: /suggest a dinner/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={onShow} />);
  expect(result.current.state.week.meals.length).toBe(1);
  expect(result.current.state.week.meals[0].meal.type).toBe("dinner");
});

it("lets the user add a specific meal they chose themselves", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  await userEvent.selectOptions(
    screen.getByLabelText(/add a specific meal/i),
    "seed-spaghetti",
  );
  await userEvent.click(screen.getByRole("button", { name: /add to week/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  expect(result.current.state.week.meals.map((m) => m.meal.id)).toContain("seed-spaghetti");
});

it("adds a beverage", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/add a beverage/i), "Coffee");
  await userEvent.click(screen.getByRole("button", { name: /add beverage/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  expect(result.current.state.week.beverages.map((b) => b.name)).toContain("Coffee");
});

it("edits servings and toggles leftovers on a planned meal", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(
    result.current.state.library.find((m) => m.id === "seed-spaghetti")!, 2, false,
  ));
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  const row = screen.getByText("Spaghetti Marinara").closest("li")!;
  const servings = row.querySelector("input[type=number]")! as HTMLInputElement;
  await userEvent.clear(servings);
  await userEvent.type(servings, "4");
  await userEvent.click(row.querySelector("input[type=checkbox]")! as HTMLInputElement);
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  const pm = result.current.state.week.meals[0];
  expect(pm.servings).toBe(4);
  expect(pm.leftovers).toBe(true);
});
