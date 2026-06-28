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

it("auto-categorizes ingredients into aisles by name", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "Power Bowl");
  const ingInput = screen.getByLabelText(/^ingredient$/i);
  for (const name of ["Chicken breasts", "Greek yogurt", "Kale"]) {
    await userEvent.type(ingInput, name);
    await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  }
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  const meal = result.current.state.library.find((m) => m.name === "Power Bowl")!;
  expect(meal.ingredients.map((i) => [i.name, i.aisle])).toEqual([
    ["Chicken breasts", "meat"],
    ["Greek yogurt", "dairy"],
    ["Kale", "produce"],
  ]);
});

it("lets the user correct an auto-detected aisle before saving", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "Snack");
  await userEvent.type(screen.getByLabelText(/^ingredient$/i), "Tofu");
  await userEvent.click(screen.getByRole("button", { name: /add ingredient/i }));
  // "Tofu" isn't in the keyword list, so it auto-detects to "other".
  expect((screen.getByLabelText(/aisle for tofu/i) as HTMLSelectElement).value).toBe("other");
  await userEvent.selectOptions(screen.getByLabelText(/aisle for tofu/i), "produce");
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  const meal = result.current.state.library.find((m) => m.name === "Snack")!;
  expect(meal.ingredients[0].aisle).toBe("produce");
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
