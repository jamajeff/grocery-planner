import type { Aisle } from "./types";

/**
 * Keyword heuristics mapping an ingredient name to a store aisle. Order matters:
 * the first aisle with a matching keyword wins. Anything unmatched is "other",
 * which the user can correct in the form.
 */
const AISLE_KEYWORDS: [Aisle, string[]][] = [
  ["meat", ["chicken", "beef", "pork", "turkey", "bacon", "sausage", "steak", "ham", "fish", "salmon", "shrimp", "tuna", "lamb", "ground", "meatball", "hot dog"]],
  ["dairy", ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "egg", "sour cream", "cottage"]],
  ["bakery", ["bread", "bun", "bagel", "roll", "tortilla", "croissant", "muffin", "baguette", "pita", "naan"]],
  ["frozen", ["frozen", "ice cream", "popsicle"]],
  ["beverages", ["water", "juice", "soda", "coffee", "tea", "wine", "beer", "lemonade", "cola", "seltzer"]],
  ["produce", ["lettuce", "kale", "spinach", "tomato", "onion", "garlic", "pepper", "apple", "banana", "berry", "berries", "carrot", "potato", "broccoli", "cucumber", "lemon", "lime", "avocado", "celery", "mushroom", "cilantro", "basil", "parsley", "ginger", "lettuce", "grape", "orange", "zucchini", "squash", "corn", "cabbage", "cauliflower", "bean sprout"]],
  ["pantry", ["rice", "pasta", "noodle", "flour", "sugar", "salt", "oil", "vinegar", "bean", "lentil", "oat", "cereal", "sauce", "can", "spice", "honey", "peanut butter", "broth", "stock", "quinoa", "granola", "syrup", "ketchup", "mustard", "mayo", "soy", "stock", "tomato paste", "couscous"]],
];

export function guessAisle(name: string): Aisle {
  const n = name.toLowerCase();
  if (!n.trim()) return "other";
  for (const [aisle, keywords] of AISLE_KEYWORDS) {
    if (keywords.some((kw) => n.includes(kw))) return aisle;
  }
  return "other";
}
