import { cn } from '../../lib/cn';
import { MONTH_LABELS } from '../../lib/format';
import { useFiltersStore } from '../../state/filters';

const QUARTERS = [
  { label: 'T1', months: [1, 2, 3] },
  { label: 'T2', months: [4, 5, 6] },
  { label: 'T3', months: [7, 8, 9] },
  { label: 'T4', months: [10, 11, 12] },
] as const;

export function MonthFilter() {
  const selected = useFiltersStore((state) => state.filters.meses) ?? [];
  const setArray = useFiltersStore((state) => state.setArray);
  const toggleValue = useFiltersStore((state) => state.toggleValue);

  const toggleQuarter = (months: ReadonlyArray<number>): void => {
    const allActive = months.every((month) => selected.includes(month));
    const next = allActive
      ? selected.filter((month) => !months.includes(month))
      : [...new Set([...selected, ...months])];
    setArray(
      'meses',
      next.sort((a, b) => a - b),
    );
  };

  return (
    <div className="space-y-1.5">
      <div role="group" aria-label="Atajos por trimestre" className="grid grid-cols-4 gap-1">
        {QUARTERS.map((quarter) => {
          const active = quarter.months.every((month) => selected.includes(month));
          return (
            <button
              key={quarter.label}
              type="button"
              aria-pressed={active}
              onClick={() => toggleQuarter(quarter.months)}
              className={cn(
                'rounded-md border px-1 py-1 text-xs font-semibold transition-colors',
                active
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
              )}
            >
              {quarter.label}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="Filtrar por mes" className="grid grid-cols-4 gap-1">
        {MONTH_LABELS.map((label, index) => {
          const month = index + 1;
          const active = selected.includes(month);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => toggleValue('meses', month)}
              className={cn(
                'rounded-md border px-1 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-accent-line bg-accent-soft text-accent-strong'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
