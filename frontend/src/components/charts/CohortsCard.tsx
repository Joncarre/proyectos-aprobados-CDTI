import { useCohorts } from '../../api/queries';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';

const COLOR_NEW = '#4f46e5';
const COLOR_RETURN = '#94a3b8';
const GRAD_NEW = 'linear-gradient(180deg, #6f72f3, #4f46e5)';
const GRAD_RETURN = 'linear-gradient(180deg, #a6b0bd, #94a3b8)';

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[0.7rem] text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_NEW }} /> Nuevas
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_RETURN }} />{' '}
        Recurrentes
      </span>
    </div>
  );
}

/**
 * Renewal timeline: one capsule bar per year split by the new/returning share.
 * The split boundary drifting across years tells the renewal story; the indigo
 * figure on the right is the renewal rate (% first-time beneficiaries).
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();
  const rows = data ?? [];

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      controls={<Legend />}
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <div className="flex h-96 flex-col justify-between py-1">
        {rows.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-ink-faint">
            Sin datos con los filtros activos
          </div>
        ) : (
          rows.map((row) => {
            const total = row.nuevas + row.recurrentes;
            const pct = total > 0 ? Math.round((row.nuevas / total) * 100) : 0;
            return (
              <div
                key={row.anio}
                className="group flex items-center gap-3 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-2"
                title={`Nuevas ${formatInt(row.nuevas)} · Recurrentes ${formatInt(row.recurrentes)} · Total ${formatInt(total)}`}
              >
                <span className="w-9 shrink-0 font-mono text-[0.7rem] text-ink-faint">
                  {row.anio}
                </span>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line/60">
                  <div style={{ width: `${pct}%`, background: GRAD_NEW }} />
                  <div className="flex-1" style={{ background: GRAD_RETURN }} />
                </div>
                <span
                  className="w-8 shrink-0 text-right font-mono text-[0.72rem] font-semibold tabular-nums"
                  style={{ color: COLOR_NEW }}
                >
                  {pct}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
