import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState> };
export function MealLibrary(_props: Props) {
  return <h2 className="text-lg font-semibold">Meal Library</h2>;
}
