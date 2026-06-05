import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState> };
export function GroceryList(_props: Props) {
  return <h2 className="text-lg font-semibold">Grocery List</h2>;
}
