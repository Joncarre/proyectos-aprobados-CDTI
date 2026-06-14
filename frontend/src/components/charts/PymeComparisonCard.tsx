import { usePymeComparison } from '../../api/queries';
import { formatInt, formatMoney, formatMoneyCompact, formatPct } from '../../lib/format';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

const GRAD_PYME = 'linear-gradient(180deg, #8b91f5, #6e74ee)';
const GRAD_BIG = 'linear-gradient(180deg, #c6cdd7, #aab4c2)';

function LegendChip({ grad, label }: { grad: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/70 py-1 pr-3 pl-1.5 text-[0.72rem] font-medium text-ink">
      <span className="size-4 rounded-full" style={{ background: grad }} />
      {label}
    </span>
  );
}

interface ShareBarProps {
  label: string;
  pyme: number;
  big: number;
  format: (value: number) => string;
}

/** Premium split capsule showing the PYME / non-PYME share of a magnitude. */
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
      <div className="flex h-9 overflow-hidden rounded-full ring-1 ring-black/[0.04]">
        <div
          className="flex items-center justify-start px-3"
          style={{ width: `${pymePct}%`, background: GRAD_PYME }}
        >
          <span className="font-mono text-[0.72rem] font-semibold whitespace-nowrap text-white">
            {Math.round(pymePct)}%
          </span>
        </div>
        <div
          className="flex items-center justify-end px-3"
          style={{ width: `${bigPct}%`, background: GRAD_BIG }}
        >
          <span className="font-mono text-[0.72rem] font-semibold whitespace-nowrap text-[#334155]">
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
          <div className="flex items-center justify-center gap-3">
            <LegendChip grad={GRAD_PYME} label="PYME" />
            <LegendChip grad={GRAD_BIG} label="No PYME" />
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
