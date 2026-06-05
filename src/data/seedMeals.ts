import type { Meal } from "../lib/types";

/**
 * Built-in starter library. Quantities are for 2 servings.
 * To add a meal: copy any object below, give it a unique id, and tag each
 * ingredient with an aisle and shelfLife.
 */
export const SEED_MEALS: Meal[] = [
  {
    id: "seed-scrambled-eggs",
    name: "Scrambled Eggs & Toast",
    type: "breakfast",
    ingredients: [
      { name: "Eggs", quantity: 4, unit: "", aisle: "dairy", shelfLife: "perishable" },
      { name: "Butter", quantity: 1, unit: "tbsp", aisle: "dairy", shelfLife: "perishable" },
      { name: "Bread", quantity: 4, unit: "slice", aisle: "bakery", shelfLife: "perishable" },
      { name: "Salt", quantity: 1, unit: "pinch", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-oatmeal",
    name: "Oatmeal with Banana",
    type: "breakfast",
    ingredients: [
      { name: "Rolled oats", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Banana", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Milk", quantity: 1, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Honey", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-yogurt-parfait",
    name: "Greek Yogurt Parfait",
    type: "breakfast",
    ingredients: [
      { name: "Greek yogurt", quantity: 2, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Granola", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Blueberries", quantity: 1, unit: "cup", aisle: "produce", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-turkey-sandwich",
    name: "Turkey Sandwich",
    type: "lunch",
    ingredients: [
      { name: "Bread", quantity: 4, unit: "slice", aisle: "bakery", shelfLife: "perishable" },
      { name: "Sliced turkey", quantity: 0.5, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Cheddar cheese", quantity: 4, unit: "slice", aisle: "dairy", shelfLife: "perishable" },
      { name: "Lettuce", quantity: 4, unit: "leaf", aisle: "produce", shelfLife: "perishable" },
      { name: "Mayonnaise", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-caesar-salad",
    name: "Chicken Caesar Salad",
    type: "lunch",
    ingredients: [
      { name: "Romaine lettuce", quantity: 1, unit: "head", aisle: "produce", shelfLife: "perishable" },
      { name: "Chicken breast", quantity: 0.75, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Parmesan cheese", quantity: 0.5, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Caesar dressing", quantity: 0.5, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Croutons", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-black-bean-bowl",
    name: "Black Bean Rice Bowl",
    type: "lunch",
    ingredients: [
      { name: "White rice", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Black beans", quantity: 1, unit: "can", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Bell pepper", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Avocado", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Cumin", quantity: 1, unit: "tsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-spaghetti",
    name: "Spaghetti Marinara",
    type: "dinner",
    ingredients: [
      { name: "Spaghetti noodles", quantity: 8, unit: "oz", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Marinara sauce", quantity: 1, unit: "jar", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Ground beef", quantity: 0.5, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Garlic", quantity: 2, unit: "clove", aisle: "produce", shelfLife: "perishable" },
      { name: "Parmesan cheese", quantity: 0.25, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-tacos",
    name: "Chicken Tacos",
    type: "dinner",
    ingredients: [
      { name: "Chicken thighs", quantity: 1, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Tortillas", quantity: 8, unit: "", aisle: "bakery", shelfLife: "perishable" },
      { name: "Taco seasoning", quantity: 1, unit: "packet", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Tomato", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Shredded cheese", quantity: 1, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Sour cream", quantity: 0.5, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-salmon",
    name: "Baked Salmon & Veggies",
    type: "dinner",
    ingredients: [
      { name: "Salmon fillet", quantity: 0.75, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Broccoli", quantity: 1, unit: "head", aisle: "produce", shelfLife: "perishable" },
      { name: "Lemon", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Olive oil", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Salt", quantity: 1, unit: "tsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
];
