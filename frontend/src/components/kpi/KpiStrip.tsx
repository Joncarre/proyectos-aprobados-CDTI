import { motion } from 'motion/react';
import type { KpiTrendPoint } from '@cdti/shared';
import { useKpiTrends, useStats } from '../../api/queries';
import { cn } from '../../lib/cn';
import { formatInt, formatMoneyCompact, formatPct } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { Skeleton } from '../ui/Skeleton';

interface Delta {
  dir: number;
  text: string;
  year: number;
}

/** Year-over-year delta from the last two complete years (excludes the in-progress year). */
function computeDelta(series: Array<number | null>, years: number[], isPct: boolean): Delta | null {
  const pairs = years
    .map((anio, index) => ({ anio, value: series[index] }))
    .filter((p): p is { anio: number; value: number } => p.value !== null && p.value !== undefined);
  if (pairs.length < 2) return null;
  const last = pairs[pairs.length - 1]!;
  const prev = pairs[pairs.length - 2]!;

  if (isPct) {
    const diff = last.value - prev.value;
    return {
      dir: Math.sign(diff),
      text: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('es-ES', { maximumFractionDigits: 1 })} pp`,
      year: prev.anio,
    };
  }
  if (prev.value === 0) return null;
  const rel = ((last.value - prev.value) / prev.value) * 100;
  return {
    dir: Math.sign(rel),
    text: `${rel >= 0 ? '+' : ''}${rel.toLocaleString('es-ES', { maximumFractionDigits: 0 })} %`,
    year: prev.anio,
  };
}

interface KpiCardProps {
  label: string;
  value: number | null;
  format: (value: number) => string;
  delta: Delta | null;
  detail?: string;
  dimmed: boolean;
}

function KpiCard({ label, value, format, delta, detail, dimmed }: KpiCardProps) {
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
              title={`frente a ${delta.year}`}
            >
              {delta.dir > 0 ? '▲' : delta.dir < 0 ? '▼' : '–'} {delta.text}{' '}
              <span className="text-ink-faint">vs {delta.year}</span>
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

const CURRENT_YEAR = new Date().getFullYear();

const container = { hidden: {}, show: { transition: { staggerChildren: 0.17 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Header KPIs: live count-up, year-over-year delta, change pulse; staggered reveal. */
export function KpiStrip({ reveal }: { reveal: boolean }) {
  const { data, isPending, isPlaceholderData } = useStats();
  const { data: trends } = useKpiTrends();

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

  // Only complete years feed the delta
  const complete: KpiTrendPoint[] = (trends ?? []).filter((point) => point.anio < CURRENT_YEAR);
  const years = complete.map((point) => point.anio);

  const cards: KpiCardProps[] = [
    {
      label: 'Proyectos',
      value: data.proyectos,
      format: formatInt,
      delta: computeDelta(
        complete.map((p) => p.proyectos),
        years,
        false,
      ),
      detail: `${formatInt(data.empresas)} empresas`,
      dimmed: isPlaceholderData,
    },
    {
      label: 'Presupuesto total',
      value: data.presupuestoTotal,
      format: formatMoneyCompact,
      delta: computeDelta(
        complete.map((p) => p.presupuesto),
        years,
        false,
      ),
      dimmed: isPlaceholderData,
    },
    {
      label: 'Aportación CDTI',
      value: data.aportacionTotal,
      format: formatMoneyCompact,
      delta: computeDelta(
        complete.map((p) => p.aportacion),
        years,
        false,
      ),
      dimmed: isPlaceholderData,
    },
    {
      label: '% medio de aportación',
      value: data.pctMedio,
      format: formatPct,
      delta: computeDelta(
        complete.map((p) => p.pctMedio),
        years,
        true,
      ),
      dimmed: isPlaceholderData,
    },
    {
      label: 'PYMEs',
      value: data.pctPymes,
      format: formatPct,
      delta: computeDelta(
        complete.map((p) => p.pctPymes),
        years,
        true,
      ),
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
