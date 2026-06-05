import { scaleIngredient } from "./scaling";
import type {
  WeekPlan,
  PantryItem,
  GroceryItem,
  GroceryListSection,
  Aisle,
} from "./types";

const AISLE_ORDER: Aisle[] = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "beverages",
  "other",
];

function key(name: string, unit: string): string {
  return `${name.toLowerCase()}|${unit.toLowerCase()}`;
}

/**
 * Build the full grocery list for a week.
 * NOTHING is ever removed: every ingredient and beverage appears.
 * Long-lasting items, and anything matched in the pantry, are flagged
 * mayAlreadyHave = "check before buying".
 */
export function generateGroceryList(
  plan: WeekPlan,
  pantry: PantryItem[],
): GroceryListSection[] {
  const pantryNames = new Set(pantry.map((p) => p.name.toLowerCase()));
  const byKey = new Map<string, GroceryItem>();

  for (const planned of plan.meals) {
    for (const ing of planned.meal.ingredients) {
      const scaled = scaleIngredient(ing, planned.servings, planned.leftovers);
      const k = key(scaled.name, scaled.unit);
      const existing = byKey.get(k);
      if (existing) {
        existing.quantity += scaled.quantity;
        if (
          scaled.shelfLife === "long-lasting" ||
          pantryNames.has(scaled.name.toLowerCase())
        ) {
          existing.mayAlreadyHave = true;
        }
      } else {
        byKey.set(k, {
          name: scaled.name,
          quantity: scaled.quantity,
          unit: scaled.unit,
          aisle: scaled.aisle,
          shelfLife: scaled.shelfLife,
          mayAlreadyHave:
            scaled.shelfLife === "long-lasting" ||
            pantryNames.has(scaled.name.toLowerCase()),
        });
      }
    }
  }

  for (const bev of plan.beverages) {
    byKey.set(`bev:${bev.id}`, {
      name: bev.name,
      quantity: 1,
      unit: "",
      aisle: "beverages",
      shelfLife: "perishable",
      mayAlreadyHave: pantryNames.has(bev.name.toLowerCase()),
    });
  }

  // Group by aisle in canonical order; skip empty aisles.
  const sections: GroceryListSection[] = [];
  for (const aisle of AISLE_ORDER) {
    const items = [...byKey.values()]
      .filter((i) => i.aisle === aisle)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (items.length > 0) sections.push({ aisle, items });
  }
  return sections;
}
