import { motion } from 'motion/react';
import { useKpiWindow, useStats } from '../../api/queries';
import { cn } from '../../lib/cn';
import { formatInt, formatMoneyCompact, formatPct } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { Skeleton } from '../ui/Skeleton';

interface Delta {
  dir: number;
  text: string;
}

/**
 * Delta between the trailing 12 months and the prior 12 months. Counts/amounts
 * use a relative %; percentages use the difference in points (pp).
 */
function windowDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  isPct: boolean,
): Delta | null {
  if (current == null || previous == null) return null;
  if (isPct) {
    const diff = current - previous;
    return {
      dir: Math.sign(diff),
      text: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('es-ES', { maximumFractionDigits: 1 })} pp`,
    };
  }
  if (previous === 0) return null;
  const rel = ((current - previous) / previous) * 100;
  return {
    dir: Math.sign(rel),
    text: `${rel >= 0 ? '+' : ''}${rel.toLocaleString('es-ES', { maximumFractionDigits: 0 })} %`,
  };
}

interface KpiCardProps {
  label: string;
  value: number | null;
  format: (value: number) => string;
  delta: Delta | null;
  deltaTitle?: string;
  detail?: string;
  dimmed: boolean;
}

function KpiCard({ label, value, format, delta, deltaTitle, detail, dimmed }: KpiCardProps) {
  const animated = useCountUp(value ?? 0);
  const display = value === null ? '—' : format(animated);

  const deltaColor =
    delta && delta.dir > 0 ? '#0d9488' : delta && delta.dir < 0 ? '#e11d48' : '#a1a1aa';

  return (
    <div className="shadow-card relative min-w-0 overflow-hidden rounded-xl border border-line bg-surface px-3 py-2.5">
      {/* Soft accent flash whenever the value changes */}
      <motion.span
        key={value ?? 'na'}
        initial={{ opacity: 0.32 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 bg-accent-soft"
        aria-hidden
      />
      <div className="relative">
        <p className="truncate text-[0.68rem] font-medium text-ink-soft">{label}</p>
        <p
          className={cn(
            'mt-1 truncate font-mono text-base font-semibold tracking-tight text-ink-strong transition-opacity lg:text-lg',
            dimmed && 'opacity-60',
          )}
        >
          {display}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem]">
          {delta ? (
            <span
              className="font-mono whitespace-nowrap"
              style={{ color: deltaColor }}
              title={deltaTitle}
            >
              {delta.dir > 0 ? '▲' : delta.dir < 0 ? '▼' : '–'} {delta.text}{' '}
              <span className="text-ink-faint">vs año anterior</span>
            </span>
          ) : (
            <span />
          )}
          {detail && <span className="truncate font-mono text-ink-faint">{detail}</span>}
        </div>
      </div>
    </div>
  );
}

/** YYYY-MM-DD → DD/MM/YYYY. */
const formatRefDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.18 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Header KPIs: live count-up, trailing-12-months delta, change pulse; staggered reveal. */
export function KpiStrip({ reveal }: { reveal: boolean }) {
  const { data, isPending, isPlaceholderData } = useStats();
  const { data: kpiWindow } = useKpiWindow();

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
            <Skeleton className="mt-2 h-2 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const cur = kpiWindow?.current;
  const prev = kpiWindow?.previous;
  const deltaTitle = kpiWindow
    ? `Últimos 12 meses (hasta ${formatRefDate(kpiWindow.refDate)}) frente a los 12 anteriores`
    : undefined;

  const cards: KpiCardProps[] = [
    {
      label: 'Proyectos',
      value: data.proyectos,
      format: formatInt,
      delta: windowDelta(cur?.proyectos, prev?.proyectos, false),
      deltaTitle,
      detail: `${formatInt(data.empresas)} empresas`,
      dimmed: isPlaceholderData,
    },
    {
      label: 'Presupuesto total',
      value: data.presupuestoTotal,
      format: formatMoneyCompact,
      delta: windowDelta(cur?.presupuesto, prev?.presupuesto, false),
      deltaTitle,
      dimmed: isPlaceholderData,
    },
    {
      label: 'Aportación CDTI',
      value: data.aportacionTotal,
      format: formatMoneyCompact,
      delta: windowDelta(cur?.aportacion, prev?.aportacion, false),
      deltaTitle,
      dimmed: isPlaceholderData,
    },
    {
      label: '% medio de aportación',
      value: data.pctMedio,
      format: formatPct,
      delta: windowDelta(cur?.pctMedio, prev?.pctMedio, true),
      deltaTitle,
      dimmed: isPlaceholderData,
    },
    {
      label: 'PYMEs',
      value: data.pctPymes,
      format: formatPct,
      delta: windowDelta(cur?.pctPymes, prev?.pctPymes, true),
      deltaTitle,
      dimmed: isPlaceholderData,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate={reveal ? 'show' : 'hidden'}
      className="grid grid-cols-2 gap-2 sm:grid-cols-5"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={item} className="min-w-0">
          <KpiCard {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
}
