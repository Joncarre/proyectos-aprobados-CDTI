import type { CohortRow } from '@cdti/shared';
import { useCohorts } from '../../api/queries';
import { formatInt } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { Card } from '../ui/Card';

const COLOR_NEW = '#4f46e5';
const COLOR_RETURN = '#94a3b8';

/** % of beneficiaries that are first-timers. */
const renewal = (row: CohortRow): number => {
  const total = row.nuevas + row.recurrentes;
  return total > 0 ? (row.nuevas / total) * 100 : 0;
};

function Total({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-lg font-semibold text-ink-strong tabular-nums">
        {formatInt(value)}
      </p>
      <p className="flex items-center justify-end gap-1.5 text-[0.62rem] tracking-wider text-ink-soft uppercase">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </p>
    </div>
  );
}

/**
 * Hero stat card: the average renewal rate (first-time share of beneficiaries
 * over the filtered period) as the focal figure, a sparkline of how it has
 * evolved, and the total new/returning companies on the right of the chart.
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();
  const rows = data ?? [];

  const totalNuevas = rows.reduce((sum, row) => sum + row.nuevas, 0);
  const totalRecurrentes = rows.reduce((sum, row) => sum + row.recurrentes, 0);
  const denom = totalNuevas + totalRecurrentes;
  const avgRate = denom > 0 ? (totalNuevas / denom) * 100 : 0;
  const animated = useCountUp(avgRate); // hook must run every render
  const maxRate = Math.max(1, ...rows.map(renewal));

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      {rows.length === 0 ? (
        <div className="grid h-96 place-items-center text-xs text-ink-faint">
          Sin datos con los filtros activos
        </div>
      ) : (
        <div className="flex h-96 flex-col">
          {/* Hero */}
          <p className="text-xs text-ink-soft">Tasa media de renovación</p>
          <span className="mt-1 font-mono text-6xl leading-none font-semibold tracking-tighter text-ink-strong tabular-nums">
            {Math.round(animated)}
            <span className="align-top text-2xl text-ink-soft">%</span>
          </span>
          <p className="mt-2 text-xs text-ink-soft">promedio del periodo filtrado</p>

          {/* Evolution + totals */}
          <div className="mt-auto">
            <p className="mb-2 text-[0.7rem] font-medium text-ink-faint">
              Evolución de la renovación
            </p>
            <div className="flex items-center gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex h-24 items-end gap-1.5">
                  {rows.map((row) => (
                    <div
                      key={row.anio}
                      className="flex-1"
                      title={`${row.anio}: ${Math.round(renewal(row))}% renovación`}
                    >
                      <div
                        className="w-full rounded-t-[3px] bg-[#a9cdf3] transition-all duration-150 hover:bg-[#86b6ef] hover:shadow-[0_2px_8px_rgba(134,182,239,0.55)]"
                        style={{ height: `${(renewal(row) / maxRate) * 96}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ink-faint">
                  <span>{rows[0]?.anio}</span>
                  <span>{rows.at(-1)?.anio}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 pb-4 text-right">
                <Total color={COLOR_NEW} value={totalNuevas} label="Nuevas" />
                <Total color={COLOR_RETURN} value={totalRecurrentes} label="Recurrentes" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
