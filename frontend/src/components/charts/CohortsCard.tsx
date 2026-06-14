import type { CohortRow } from '@cdti/shared';
import { useCohorts } from '../../api/queries';
import { formatInt } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { Card } from '../ui/Card';

const COLOR_NEW = '#4f46e5';
const COLOR_RETURN = '#94a3b8';
const CURRENT_YEAR = new Date().getFullYear();

/** % of beneficiaries that are first-timers. */
const renewal = (row: CohortRow): number => {
  const total = row.nuevas + row.recurrentes;
  return total > 0 ? (row.nuevas / total) * 100 : 0;
};

function MiniStat({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-ink-strong">{formatInt(value)}</p>
        <p className="truncate text-[0.65rem] text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

/**
 * Hero stat card: the renewal rate (share of first-time beneficiaries) of the
 * last complete year as the focal figure, with its year-over-year trend, a
 * sparkline of how it has evolved, and the year's new/returning breakdown.
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();
  const rows = data ?? [];
  const complete = rows.filter((row) => row.anio < CURRENT_YEAR);
  const latest = complete.at(-1);
  const prev = complete.at(-2);

  const rate = latest ? renewal(latest) : 0;
  const animated = useCountUp(rate); // hook must run every render
  const deltaPp = latest && prev ? renewal(latest) - renewal(prev) : null;
  const maxRate = Math.max(1, ...complete.map(renewal));

  const up = (deltaPp ?? 0) >= 0;
  const trendColor = up ? '#0d9488' : '#e11d48';

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      {!latest ? (
        <div className="grid h-96 place-items-center text-xs text-ink-faint">
          Sin datos suficientes con los filtros activos
        </div>
      ) : (
        <div className="flex h-96 flex-col">
          {/* Hero */}
          <p className="text-xs text-ink-soft">Tasa de renovación · {latest.anio}</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="font-mono text-6xl leading-none font-semibold tracking-tighter text-ink-strong tabular-nums">
              {Math.round(animated)}
              <span className="align-top text-2xl text-ink-soft">%</span>
            </span>
            {deltaPp !== null && (
              <span
                className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium"
                style={{ color: trendColor, backgroundColor: `${trendColor}1a` }}
                title={`Frente a ${prev?.anio}`}
              >
                {up ? '▲' : '▼'} {Math.abs(deltaPp).toFixed(1)} pp
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            de los beneficiarios recibían su{' '}
            <span className="font-medium text-ink">primera ayuda</span>
          </p>

          {/* Evolution sparkline */}
          <div className="mt-auto">
            <p className="mb-2 text-[0.7rem] font-medium text-ink-faint">
              Evolución de la renovación
            </p>
            <div className="flex h-24 items-end gap-1.5">
              {complete.map((row) => {
                const isLast = row.anio === latest.anio;
                return (
                  <div
                    key={row.anio}
                    className="flex-1"
                    title={`${row.anio}: ${Math.round(renewal(row))}% renovación`}
                  >
                    <div
                      className="w-full rounded-t-[3px] transition-[height] duration-500"
                      style={{
                        height: `${(renewal(row) / maxRate) * 96}px`,
                        backgroundColor: isLast ? COLOR_NEW : '#c7d2fe',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ink-faint">
              <span>{complete[0]?.anio}</span>
              <span>{latest.anio}</span>
            </div>
          </div>

          {/* Latest-year breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <MiniStat color={COLOR_NEW} value={latest.nuevas} label={`nuevas en ${latest.anio}`} />
            <MiniStat
              color={COLOR_RETURN}
              value={latest.recurrentes}
              label={`recurrentes en ${latest.anio}`}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
