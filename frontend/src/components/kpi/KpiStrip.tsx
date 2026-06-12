import { cn } from '../../lib/cn';
import { formatInt, formatMoneyCompact, formatPct } from '../../lib/format';
import { useStats } from '../../api/queries';
import { Skeleton } from '../ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  dimmed: boolean;
}

function KpiCard({ label, value, detail, dimmed }: KpiCardProps) {
  return (
    <div className="shadow-card min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="truncate text-[0.68rem] font-medium text-ink-soft">{label}</p>
      <p
        className={cn(
          'mt-1 truncate font-mono text-base font-semibold tracking-tight text-ink-strong transition-opacity duration-200 lg:text-lg',
          dimmed && 'opacity-50',
        )}
      >
        {value}
      </p>
      {detail !== undefined && (
        <p className="mt-0.5 truncate font-mono text-[0.65rem] text-ink-faint">{detail}</p>
      )}
    </div>
  );
}

/** Header KPIs, live-updated on every filter change (smooth: keeps previous data while fetching). */
export function KpiStrip() {
  const { data, isPending, isPlaceholderData } = useStats();

  if (isPending || !data) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-busy="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="shadow-card rounded-xl border border-line bg-surface px-3 py-2.5"
          >
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <KpiCard
        label="Proyectos"
        value={formatInt(data.proyectos)}
        detail={`${formatInt(data.empresas)} empresas`}
        dimmed={isPlaceholderData}
      />
      <KpiCard
        label="Presupuesto total"
        value={formatMoneyCompact(data.presupuestoTotal)}
        dimmed={isPlaceholderData}
      />
      <KpiCard
        label="Aportación CDTI"
        value={formatMoneyCompact(data.aportacionTotal)}
        dimmed={isPlaceholderData}
      />
      <KpiCard
        label="% medio de aportación"
        value={formatPct(data.pctMedio)}
        dimmed={isPlaceholderData}
      />
      <KpiCard label="PYMEs" value={formatPct(data.pctPymes)} dimmed={isPlaceholderData} />
    </div>
  );
}
