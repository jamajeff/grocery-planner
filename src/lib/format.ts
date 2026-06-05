/** Render a quantity for display: "2 lb", or just "2" for unitless items. */
export function fmtQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}
