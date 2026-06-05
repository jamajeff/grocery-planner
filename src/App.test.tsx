import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => localStorage.clear());

  it("shows the This Week screen by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /this week/i })).toBeInTheDocument();
  });

  it("navigates to the Meal Library tab", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /library/i }));
    expect(screen.getByRole("heading", { name: /meal library/i })).toBeInTheDocument();
  });
});
