import { useState } from 'react';
import { useFiltersStore } from '../../state/filters';
import { RangeSlider } from '../ui/RangeSlider';

/** Year range slider: committing a sub-range selects every year inside it. */
export function YearFilter({ anios }: { anios: number[] }) {
  const min = anios[0] ?? 2014;
  const max = anios[anios.length - 1] ?? 2026;

  const selected = useFiltersStore((state) => state.filters.anios);
  const setArray = useFiltersStore((state) => state.setArray);
  const clearKey = useFiltersStore((state) => state.clearKey);

  const committed: [number, number] = selected?.length
    ? [Math.min(...selected), Math.max(...selected)]
    : [min, max];
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const [low, high] = dragRange ?? committed;

  const commit = ([from, to]: [number, number]): void => {
    setDragRange(null);
    if (from <= min && to >= max) {
      clearKey('anios');
      return;
    }
    const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
    setArray('anios', years);
  };

  return (
    <div className="space-y-1.5">
      <RangeSlider
        min={min}
        max={max}
        value={[low, high]}
        onValueChange={setDragRange}
        onValueCommit={commit}
        ariaLabelMin="Año inicial"
        ariaLabelMax="Año final"
      />
      <div className="flex justify-between font-mono text-xs text-ink-soft">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
