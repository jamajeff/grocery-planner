import { describe, it, expect } from "vitest";
import { scaleIngredient } from "./scaling";
import type { Ingredient } from "./types";

const noodles: Ingredient = {
  name: "Spaghetti noodles",
  quantity: 8,
  unit: "oz",
  aisle: "pantry",
  shelfLife: "long-lasting",
};

describe("scaleIngredient", () => {
  it("returns base quantity for 2 servings, no leftovers", () => {
    expect(scaleIngredient(noodles, 2, false).quantity).toBe(8);
  });

  it("scales by servings relative to base of 2", () => {
    expect(scaleIngredient(noodles, 4, false).quantity).toBe(16);
    expect(scaleIngredient(noodles, 1, false).quantity).toBe(4);
  });

  it("doubles when leftovers is true", () => {
    expect(scaleIngredient(noodles, 2, true).quantity).toBe(16);
  });

  it("combines servings and leftovers", () => {
    expect(scaleIngredient(noodles, 4, true).quantity).toBe(32);
  });

  it("preserves name, unit, aisle, shelfLife", () => {
    const out = scaleIngredient(noodles, 4, false);
    expect(out).toMatchObject({
      name: "Spaghetti noodles",
      unit: "oz",
      aisle: "pantry",
      shelfLife: "long-lasting",
    });
  });
});
