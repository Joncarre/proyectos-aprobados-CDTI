import { useMemo } from 'react';
import { useCohorts } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, SPLIT_LINE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const COLOR_NEW = '#6e74ee';
const COLOR_RETURN = '#94a3b8';
const GREEN = '#43c094'; // soft pastel green — new beneficiaries dominate
const RED = '#ec8a8a'; // soft pastel red — returning ones dominate

/** Vertical gradient (saturated tip → light base), matching the other bars. */
const grad = (top: string, bottom: string) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: top },
    { offset: 1, color: bottom },
  ],
});

/**
 * Stacked bars of new vs returning beneficiaries per year (with a value axis and
 * a floating tooltip), plus a signed renewal balance top-right: positive/green
 * when first-timers dominate, negative/red when repeats do.
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();
  const rows = useMemo(() => data ?? [], [data]);

  const totalNuevas = rows.reduce((sum, row) => sum + row.nuevas, 0);
  const totalRecurrentes = rows.reduce((sum, row) => sum + row.recurrentes, 0);
  const total = totalNuevas + totalRecurrentes;
  const newDominates = totalNuevas >= totalRecurrentes;
  const magnitude =
    total > 0 ? Math.round(((newDominates ? totalNuevas : totalRecurrentes) / total) * 100) : 0;

  const option = useMemo(() => {
    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        axisPointer: {
          type: 'shadow' as const,
          shadowStyle: { color: 'rgba(226, 232, 240, 0.45)' },
        },
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          const totalAnio = row.nuevas + row.recurrentes;
          const pct = totalAnio > 0 ? Math.round((row.nuevas / totalAnio) * 100) : 0;
          return (
            ttTitle(String(row.anio)) +
            ttRow('Nuevas', formatInt(row.nuevas), COLOR_NEW) +
            ttRow('Recurrentes', formatInt(row.recurrentes), COLOR_RETURN) +
            ttRow('Total', formatInt(totalAnio)) +
            ttRow('Renovación', `${pct} %`)
          );
        },
      },
      grid: { left: 8, right: 12, top: 50, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: rows.map((row) => String(row.anio)),
        axisLabel: AXIS_LABEL,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatInt(value) },
        splitLine: SPLIT_LINE,
      },
      series: [
        {
          name: 'Nuevas',
          type: 'bar' as const,
          stack: 'cohortes',
          barWidth: '58%',
          data: rows.map((row) => row.nuevas),
          itemStyle: { color: grad('#7c83f3', '#aab0f6'), borderRadius: [3, 3, 0, 0] },
          emphasis: {
            itemStyle: {
              color: grad('#5b63ee', '#9aa0f4'),
              shadowBlur: 12,
              shadowColor: 'rgba(110, 116, 238, 0.5)',
            },
          },
        },
        {
          name: 'Recurrentes',
          type: 'bar' as const,
          stack: 'cohortes',
          data: rows.map((row) => row.recurrentes),
          itemStyle: { color: grad('#94a3b8', '#c2cad4'), borderRadius: [3, 3, 0, 0] },
          emphasis: {
            itemStyle: {
              color: grad('#7c8ba3', '#aeb8c5'),
              shadowBlur: 12,
              shadowColor: 'rgba(148, 163, 184, 0.5)',
            },
          },
        },
      ],
    };
  }, [rows]);

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <div className="relative">
        {/* Signed renewal balance */}
        {total > 0 && (
          <div className="pointer-events-none absolute top-0 right-1 z-10 text-right">
            <span
              className="font-mono text-3xl leading-none font-semibold tabular-nums"
              style={{ color: newDominates ? GREEN : RED }}
            >
              {newDominates ? '+' : '−'}
              {magnitude}%
            </span>
            <p className="mt-0.5 text-[0.62rem] tracking-wide text-ink-soft">
              {newDominates ? 'más nuevos' : 'más recurrentes'}
            </p>
          </div>
        )}

        <EChart option={option} className="h-96 w-full" />
      </div>
    </Card>
  );
}
