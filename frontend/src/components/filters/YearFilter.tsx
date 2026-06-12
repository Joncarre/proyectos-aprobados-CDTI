import { cn } from '../../lib/cn';
import { useFiltersStore } from '../../state/filters';

export function YearFilter({ anios }: { anios: number[] }) {
  const selected = useFiltersStore((state) => state.filters.anios) ?? [];
  const toggleValue = useFiltersStore((state) => state.toggleValue);

  return (
    <div role="group" aria-label="Filtrar por año" className="grid grid-cols-4 gap-1">
      {anios.map((anio) => {
        const active = selected.includes(anio);
        return (
          <button
            key={anio}
            type="button"
            aria-pressed={active}
            onClick={() => toggleValue('anios', anio)}
            className={cn(
              'rounded-md border px-1 py-1 text-xs font-medium tabular-nums transition-colors',
              active
                ? 'border-accent-line bg-accent-soft text-accent-strong'
                : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
            )}
          >
            {anio}
          </button>
        );
      })}
    </div>
  );
}
