import { BASE_SERVINGS, LEFTOVER_MULTIPLIER } from "./types";
import type { Ingredient } from "./types";

/** Scale a base (2-serving) ingredient for chosen servings + leftovers. */
export function scaleIngredient(
  ingredient: Ingredient,
  servings: number,
  leftovers: boolean,
): Ingredient {
  const factor =
    (servings / BASE_SERVINGS) * (leftovers ? LEFTOVER_MULTIPLIER : 1);
  return { ...ingredient, quantity: ingredient.quantity * factor };
}
