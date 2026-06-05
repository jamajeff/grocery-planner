import { describe, it, expect } from "vitest";
import { toRemindersText, toNotesText } from "./exportList";
import type { GroceryListSection } from "./types";

const sections: GroceryListSection[] = [
  {
    aisle: "produce",
    items: [
      { name: "Onion", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable", mayAlreadyHave: false },
      { name: "Tomato", quantity: 3, unit: "", aisle: "produce", shelfLife: "perishable", mayAlreadyHave: false },
    ],
  },
  {
    aisle: "meat",
    items: [
      { name: "Chicken breast", quantity: 2, unit: "lb", aisle: "meat", shelfLife: "perishable", mayAlreadyHave: false },
    ],
  },
];

describe("toRemindersText", () => {
  it("renders one item per line with quantity, no headers", () => {
    expect(toRemindersText(sections)).toBe("Onion 2\nTomato 3\nChicken breast 2 lb");
  });

  it("returns empty string for no sections", () => {
    expect(toRemindersText([])).toBe("");
  });
});

describe("toNotesText", () => {
  it("groups items under capitalized aisle headers with blank lines between", () => {
    expect(toNotesText(sections)).toBe(
      "Produce\n- Onion 2\n- Tomato 3\n\nMeat\n- Chicken breast 2 lb",
    );
  });

  it("returns empty string for no sections", () => {
    expect(toNotesText([])).toBe("");
  });
});
