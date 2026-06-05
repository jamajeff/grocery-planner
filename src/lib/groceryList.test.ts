import { describe, it, expect } from "vitest";
import { generateGroceryList } from "./groceryList";
import type { WeekPlan, PantryItem, Ingredient, Meal } from "./types";

function meal(name: string, ingredients: Ingredient[]): Meal {
  return { id: name, name, type: "dinner", ingredients };
}

const pasta = meal("Pasta", [
  { name: "Spaghetti noodles", quantity: 8, unit: "oz", aisle: "pantry", shelfLife: "long-lasting" },
  { name: "Tomato", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
]);

const salad = meal("Salad", [
  { name: "Tomato", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
  { name: "Olive oil", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
]);

const plan: WeekPlan = {
  meals: [
    { id: "p1", meal: pasta, servings: 2, leftovers: false },
    { id: "p2", meal: salad, servings: 2, leftovers: false },
  ],
  beverages: [{ id: "b1", name: "Sparkling water" }],
};

describe("generateGroceryList", () => {
  it("aggregates the same ingredient across meals (same name + unit)", () => {
    const sections = generateGroceryList(plan, []);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.quantity).toBe(3); // 2 + 1
  });

  it("groups items by aisle", () => {
    const sections = generateGroceryList(plan, []);
    const aisles = sections.map((s) => s.aisle);
    expect(aisles).toContain("produce");
    expect(aisles).toContain("pantry");
    expect(aisles).toContain("beverages");
  });

  it("flags long-lasting items as mayAlreadyHave", () => {
    const sections = generateGroceryList(plan, []);
    const pantry = sections.find((s) => s.aisle === "pantry")!;
    const noodles = pantry.items.find((i) => i.name === "Spaghetti noodles")!;
    expect(noodles.mayAlreadyHave).toBe(true);
  });

  it("does NOT flag perishable items by default", () => {
    const sections = generateGroceryList(plan, []);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.mayAlreadyHave).toBe(false);
  });

  it("flags a perishable item when it is in the pantry (case-insensitive)", () => {
    const pantry: PantryItem[] = [{ id: "x", name: "tomato" }];
    const sections = generateGroceryList(plan, pantry);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.mayAlreadyHave).toBe(true);
  });

  it("includes beverages in the beverages aisle and never removes them", () => {
    const sections = generateGroceryList(plan, []);
    const bev = sections.find((s) => s.aisle === "beverages")!;
    expect(bev.items.map((i) => i.name)).toContain("Sparkling water");
  });

  it("scales aggregated quantities by servings and leftovers", () => {
    const scaled: WeekPlan = {
      meals: [{ id: "p1", meal: pasta, servings: 4, leftovers: true }],
      beverages: [],
    };
    const sections = generateGroceryList(scaled, []);
    const noodles = sections
      .find((s) => s.aisle === "pantry")!
      .items.find((i) => i.name === "Spaghetti noodles")!;
    expect(noodles.quantity).toBe(32); // 8 * (4/2) * 2
  });

  it("returns sections in canonical aisle order", () => {
    const order = generateGroceryList(plan, []).map((s) => s.aisle);
    expect(order).toEqual(["produce", "pantry", "beverages"]);
  });

  it("sets mayAlreadyHave=true when later duplicate occurrence is long-lasting", () => {
    const firstPerishable = meal("MealA", [
      { name: "Butter", quantity: 1, unit: "tbsp", aisle: "dairy", shelfLife: "perishable" },
    ]);
    const secondLongLasting = meal("MealB", [
      { name: "Butter", quantity: 2, unit: "tbsp", aisle: "dairy", shelfLife: "long-lasting" },
    ]);
    const mixedPlan: WeekPlan = {
      meals: [
        { id: "m1", meal: firstPerishable, servings: 2, leftovers: false },
        { id: "m2", meal: secondLongLasting, servings: 2, leftovers: false },
      ],
      beverages: [],
    };
    const sections = generateGroceryList(mixedPlan, []);
    const dairy = sections.find((s) => s.aisle === "dairy")!;
    const butter = dairy.items.find((i) => i.name === "Butter")!;
    expect(butter.mayAlreadyHave).toBe(true);
    expect(butter.quantity).toBe(3); // 1 + 2
  });

  it("includes all beverages with the same name (different ids) and works with no meals", () => {
    const bevOnly: WeekPlan = {
      meals: [],
      beverages: [
        { id: "bev-1", name: "Orange juice" },
        { id: "bev-2", name: "Orange juice" },
      ],
    };
    const sections = generateGroceryList(bevOnly, []);
    expect(sections.length).toBe(1);
    const bev = sections.find((s) => s.aisle === "beverages")!;
    expect(bev.items.filter((i) => i.name === "Orange juice").length).toBe(2);
  });
});
