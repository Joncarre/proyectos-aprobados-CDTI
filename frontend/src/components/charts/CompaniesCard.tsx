import { useCompanies } from '../../api/queries';
import { cn } from '../../lib/cn';
import { formatInt, formatMoneyCompact, formatPct } from '../../lib/format';
import { useFiltersStore } from '../../state/filters';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

const LIMIT = 12;

/** Recurring companies (by NIF) within the filtered set; click pins one company. */
export function CompaniesCard() {
  const { data, isPending, isPlaceholderData } = useCompanies(2, LIMIT);
  const activeNif = useFiltersStore((state) => state.filters.nif);
  const setNif = useFiltersStore((state) => state.setNif);

  const toggleNif = (nif: string): void => {
    setNif(activeNif === nif ? undefined : nif);
  };

  return (
    <Card
      title="Empresas recurrentes"
      subtitle="Más de dos proyectos en el conjunto filtrado"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <div className="h-96 space-y-1 overflow-y-auto pr-1">
        {(data ?? []).length === 0 && !isPending ? (
          <p className="py-10 text-center text-xs text-ink-faint">
            Ninguna empresa con más de un proyecto en el conjunto filtrado
          </p>
        ) : (
          (data ?? []).map((company, index) => {
            const active = activeNif === company.nif;
            return (
              <button
                key={company.nif}
                type="button"
                onClick={() => toggleNif(company.nif)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-select-line bg-select-soft'
                    : 'border-transparent hover:bg-surface-2',
                )}
              >
                <span className="w-5 shrink-0 font-mono text-xs font-semibold text-ink-faint">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{company.razonSocial}</span>
                  <span className="block font-mono text-[0.65rem] text-ink-faint">
                    {company.nif} · {company.primerAnio}–{company.ultimoAnio} · % medio{' '}
                    {formatPct(company.pctMedio)}
                  </span>
                </span>
                <span className="w-24 shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-center font-mono text-[0.65rem] font-semibold text-accent-strong">
                  {formatInt(company.proyectos)} Proyectos
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-xs font-medium">
                  {formatMoneyCompact(company.aportacion)}
                </span>
              </button>
            );
          })
        )}
        {isPending &&
          Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}
      </div>
    </Card>
  );
}
