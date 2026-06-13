import { usePymeComparison } from '../../api/queries';
import { formatInt, formatMoney, formatMoneyCompact, formatPct } from '../../lib/format';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

const COLOR_PYME = '#6366f1';
const COLOR_BIG = '#5b6373';

interface ShareBarProps {
  label: string;
  pyme: number;
  big: number;
  format: (value: number) => string;
}

/** Horizontal split bar showing the PYME / non-PYME share of a magnitude. */
function ShareBar({ label, pyme, big, format }: ShareBarProps) {
  const total = pyme + big;
  const pymePct = total > 0 ? (pyme / total) * 100 : 0;
  const bigPct = 100 - pymePct;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-strong">{label}</span>
        <span className="font-mono text-[0.7rem] text-ink-faint">{format(total)} total</span>
      </div>
      <div className="flex h-8 overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-start px-2"
          style={{ width: `${pymePct}%`, backgroundColor: COLOR_PYME }}
        >
          <span className="font-mono text-[0.7rem] font-semibold whitespace-nowrap text-white">
            {Math.round(pymePct)}%
          </span>
        </div>
        <div
          className="flex items-center justify-end px-2"
          style={{ width: `${bigPct}%`, backgroundColor: COLOR_BIG }}
        >
          <span className="font-mono text-[0.7rem] font-semibold whitespace-nowrap text-white">
            {Math.round(bigPct)}%
          </span>
        </div>
      </div>
      <div className="flex justify-between font-mono text-[0.7rem] text-ink-soft">
        <span>{format(pyme)}</span>
        <span>{format(big)}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, pyme, big }: { label: string; pyme: string; big: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 py-1.5">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="w-20 text-right font-mono text-xs font-semibold text-ink-strong">
        {pyme}
      </span>
      <span className="w-20 text-right font-mono text-xs text-ink">{big}</span>
    </div>
  );
}

export function PymeComparisonCard() {
  const { data, isPending, isPlaceholderData } = usePymeComparison();

  const pyme = data?.find((group) => group.grupo === 'pyme');
  const big = data?.find((group) => group.grupo === 'no');

  return (
    <Card
      title="PYME vs. no PYME"
      subtitle="Distribución de ayudas entre grandes y pequeñas empresas"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-80"
    >
      {!pyme || !big ? (
        <div className="h-80 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex h-80 flex-col justify-center gap-4">
          <div className="flex items-center justify-center gap-5 text-[0.7rem] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_PYME }} />
              PYME
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLOR_BIG }} />
              No PYME
            </span>
          </div>

          <ShareBar
            label="Proyectos"
            pyme={pyme.proyectos}
            big={big.proyectos}
            format={formatInt}
          />
          <ShareBar
            label="Aportación CDTI"
            pyme={pyme.aportacion}
            big={big.aportacion}
            format={formatMoneyCompact}
          />

          <div className="border-t border-line pt-1">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-1">
              <span />
              <span className="w-20 text-right text-[0.65rem] font-semibold tracking-wider text-accent-strong uppercase">
                PYME
              </span>
              <span className="w-20 text-right text-[0.65rem] font-semibold tracking-wider text-ink-soft uppercase">
                No PYME
              </span>
            </div>
            <MetricRow
              label="Aportación media por proyecto"
              pyme={formatMoney(pyme.ticketMedio)}
              big={formatMoney(big.ticketMedio)}
            />
            <MetricRow
              label="% medio de aportación"
              pyme={formatPct(pyme.pctMedio)}
              big={formatPct(big.pctMedio)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
