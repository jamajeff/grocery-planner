export type MealType = "breakfast" | "lunch" | "dinner";
export type ShelfLife = "perishable" | "long-lasting";
export type Aisle =
  | "produce"
  | "meat"
  | "dairy"
  | "bakery"
  | "frozen"
  | "pantry"
  | "beverages"
  | "other";

/** A single ingredient. Quantities are stated for BASE_SERVINGS (2) people. */
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string; // e.g. "lb", "oz", "cup", "" for countless items
  aisle: Aisle;
  shelfLife: ShelfLife;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  ingredients: Ingredient[];
}

/** A meal placed into a week, with chosen servings + leftovers. */
export interface PlannedMeal {
  id: string; // unique within the week
  meal: Meal; // snapshot of the chosen meal
  servings: number;
  leftovers: boolean;
}

export interface Beverage {
  id: string;
  name: string;
}

export interface WeekPlan {
  meals: PlannedMeal[];
  beverages: Beverage[];
}

export interface PantryItem {
  id: string;
  name: string;
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  shelfLife: ShelfLife;
  /** true when long-lasting OR matched in the pantry: "check before buying". */
  mayAlreadyHave: boolean;
}

export interface GroceryListSection {
  aisle: Aisle;
  items: GroceryItem[];
}

export const BASE_SERVINGS = 2;
export const LEFTOVER_MULTIPLIER = 2;
