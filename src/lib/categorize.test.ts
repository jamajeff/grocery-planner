import { it, expect } from "vitest";
import { guessAisle } from "./categorize";

it("categorizes meat by name", () => {
  expect(guessAisle("Chicken breasts")).toBe("meat");
  expect(guessAisle("ground beef")).toBe("meat");
  expect(guessAisle("Salmon fillet")).toBe("meat");
});

it("categorizes dairy by name", () => {
  expect(guessAisle("Greek yogurt")).toBe("dairy");
  expect(guessAisle("Milk")).toBe("dairy");
  expect(guessAisle("Cheddar cheese")).toBe("dairy");
});

it("categorizes produce by name", () => {
  expect(guessAisle("Kale")).toBe("produce");
  expect(guessAisle("Roma tomatoes")).toBe("produce");
  expect(guessAisle("Banana")).toBe("produce");
});

it("categorizes bakery, pantry, and beverages by name", () => {
  expect(guessAisle("Sourdough bread")).toBe("bakery");
  expect(guessAisle("Brown rice")).toBe("pantry");
  expect(guessAisle("Quinoa")).toBe("pantry");
  expect(guessAisle("Orange juice")).toBe("beverages");
});

it("falls back to other for unknown names", () => {
  expect(guessAisle("Sploonium")).toBe("other");
  expect(guessAisle("")).toBe("other");
});
