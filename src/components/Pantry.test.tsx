import { it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { Pantry } from "./Pantry";

beforeEach(() => localStorage.clear());

it("shows pre-loaded staples and adds a new item", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<Pantry planner={result.current} />);
  expect(screen.getByText("Salt")).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/add an item/i), "Rice");
  await userEvent.click(screen.getByRole("button", { name: /add to pantry/i }));
  rerender();
  rr(<Pantry planner={result.current} />);
  expect(result.current.state.pantry.map((p) => p.name)).toContain("Rice");
});
