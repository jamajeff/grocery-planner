import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState>; onShowGrocery: () => void };
export function ThisWeek(_props: Props) {
  return <h2 className="text-lg font-semibold">This Week</h2>;
}
