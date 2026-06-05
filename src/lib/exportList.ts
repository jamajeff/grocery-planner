import { fmtQty } from "./format";
import type { GroceryListSection } from "./types";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Flat list, one item per line ("<name> <qty>"), no headers. */
export function toRemindersText(sections: GroceryListSection[]): string {
  return sections
    .flatMap((s) => s.items.map((i) => `${i.name} ${fmtQty(i.quantity, i.unit)}`))
    .join("\n");
}

/** Aisle headers, each followed by "- <name> <qty>" lines, blank line between aisles. */
export function toNotesText(sections: GroceryListSection[]): string {
  return sections
    .map((s) =>
      [cap(s.aisle), ...s.items.map((i) => `- ${i.name} ${fmtQty(i.quantity, i.unit)}`)].join("\n"),
    )
    .join("\n\n");
}
