import { it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { GroceryList } from "./GroceryList";
import { SEED_MEALS } from "../data/seedMeals";

beforeEach(() => localStorage.clear());

function spaghetti() {
  return SEED_MEALS.find((m) => m.id === "seed-spaghetti")!;
}

it("renders aisle sections with items from the week", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  expect(screen.getByText(/spaghetti noodles/i)).toBeInTheDocument();
  expect(screen.getByText(/produce/i)).toBeInTheDocument();
});

it("flags long-lasting items with a check-before-buying note", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  const row = screen.getByText(/spaghetti noodles/i).closest("li")!;
  expect(row.textContent).toMatch(/check before buying/i);
});

it("strikes an item in place when 'already have' is tapped, without removing it", async () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  const row = screen.getByText(/spaghetti noodles/i).closest("li")!;
  const toggle = row.querySelector("input[type=checkbox]")! as HTMLInputElement;
  await userEvent.click(toggle);
  expect(screen.getByText(/spaghetti noodles/i)).toBeInTheDocument(); // still present
  expect(row).toHaveClass("line-through");
});

it("copies the reminders-format list to the clipboard", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /copy grocery list for reminders/i }));
  expect(writeText).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /copy grocery list for reminders/i })).toHaveTextContent("Copied!");
});

it("finishes the week from the grocery list, archiving and clearing it", async () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /finish this week/i }));
  expect(result.current.state.archive.length).toBe(1);
  expect(result.current.state.week.meals).toEqual([]);
});

it("shows an empty message when no meals are planned", () => {
  const { result } = renderHook(() => usePlannerState());
  render(<GroceryList planner={result.current} />);
  expect(screen.getByText(/no meals planned/i)).toBeInTheDocument();
});
