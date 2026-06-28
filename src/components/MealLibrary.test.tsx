import { it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { MealLibrary } from "./MealLibrary";

beforeEach(() => localStorage.clear());

it("lists seeded meals and filters by search", async () => {
  const { result } = renderHook(() => usePlannerState());
  render(<MealLibrary planner={result.current} />);
  expect(screen.getByText("Spaghetti Marinara")).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/search meals/i), "taco");
  expect(screen.queryByText("Spaghetti Marinara")).not.toBeInTheDocument();
  expect(screen.getByText("Chicken Tacos")).toBeInTheDocument();
});

it("creates a custom meal with one ingredient and adds it to the library", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "Grilled Cheese");
  await userEvent.type(screen.getByLabelText(/^ingredient$/i), "Bread");
  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  expect(result.current.state.library.map((m) => m.name)).toContain("Grilled Cheese");
});

it("creates a custom meal with multiple ingredients", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "BLT");
  const ingInput = screen.getByLabelText(/^ingredient$/i);
  for (const name of ["Bacon", "Lettuce", "Tomato"]) {
    await userEvent.type(ingInput, name);
    await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  }
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  const meal = result.current.state.library.find((m) => m.name === "BLT")!;
  expect(meal.ingredients.map((i) => i.name)).toEqual(["Bacon", "Lettuce", "Tomato"]);
});

it("removes an ingredient from the list before saving", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "Salad");
  const ingInput = screen.getByLabelText(/^ingredient$/i);
  for (const name of ["Lettuce", "Crouton", "Tomato"]) {
    await userEvent.type(ingInput, name);
    await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  }
  await userEvent.click(screen.getByRole("button", { name: /remove crouton/i }));
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  const meal = result.current.state.library.find((m) => m.name === "Salad")!;
  expect(meal.ingredients.map((i) => i.name)).toEqual(["Lettuce", "Tomato"]);
});
