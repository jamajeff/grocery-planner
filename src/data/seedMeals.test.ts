import { describe, it, expect } from "vitest";
import { SEED_MEALS } from "./seedMeals";

describe("SEED_MEALS", () => {
  it("has at least one of each meal type", () => {
    const types = new Set(SEED_MEALS.map((m) => m.type));
    expect(types.has("breakfast")).toBe(true);
    expect(types.has("lunch")).toBe(true);
    expect(types.has("dinner")).toBe(true);
  });

  it("every meal has a unique id and at least one ingredient", () => {
    const ids = new Set<string>();
    for (const m of SEED_MEALS) {
      expect(m.ingredients.length).toBeGreaterThan(0);
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
    }
  });

  it("every ingredient is fully tagged", () => {
    for (const m of SEED_MEALS) {
      for (const ing of m.ingredients) {
        expect(ing.name.length).toBeGreaterThan(0);
        expect(["perishable", "long-lasting"]).toContain(ing.shelfLife);
        expect([
          "produce", "meat", "dairy", "bakery", "frozen", "pantry", "beverages", "other",
        ]).toContain(ing.aisle);
      }
    }
  });
});
