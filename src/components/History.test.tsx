import { it, expect, beforeEach, vi } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { History } from "./History";
import { usePlannerState } from "../hooks/usePlannerState";
import { SEED_MEALS } from "../data/seedMeals";

beforeEach(() => localStorage.clear());

function spaghetti() {
  return SEED_MEALS.find((m) => m.id === "seed-spaghetti")!;
}

it("shows an empty state when there are no archived weeks", () => {
  const { result } = renderHook(() => usePlannerState());
  render(<History planner={result.current} />);
  expect(screen.getByText(/no finished weeks yet/i)).toBeInTheDocument();
});

it("lists archived weeks and restores one on click", async () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  act(() => result.current.finishWeek());
  render(<History planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /restore/i }));
  expect(result.current.state.week.meals.length).toBe(1);
});

it("confirms before replacing a non-empty current week on restore", async () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  act(() => result.current.finishWeek());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false)); // current week now non-empty
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<History planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /restore/i }));
  expect(confirmSpy).toHaveBeenCalled();
  confirmSpy.mockRestore();
});
