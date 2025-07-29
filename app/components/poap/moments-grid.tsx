import { type Moment } from "./moments-timeline-types";
import { DynamicMomentsGrid } from "./dynamic-moments-grid";

interface MomentsGridProps {
  moments: Moment[];
  onLayoutCalculated?: (maxWidth: number) => void;
}

export function MomentsGrid({ moments, onLayoutCalculated }: MomentsGridProps) {
  return (
    <DynamicMomentsGrid moments={moments} onLayoutCalculated={onLayoutCalculated} />
  );
}
