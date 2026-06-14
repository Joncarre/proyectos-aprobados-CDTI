import { useMemo } from 'react';
import { useCohorts } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const COLOR_NEW = '#4f46e5'; // intake, flows up
const COLOR_RETURN = '#0d9488'; // returning base, flows down

/** Gradient that intensifies toward the centre baseline. */
const flow = (rgb: string, fromCentre: boolean) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: fromCentre
    ? [
        { offset: 0, color: `rgba(${rgb}, 0.55)` },
        { offset: 1, color: `rgba(${rgb}, 0.05)` },
      ]
    : [
        { offset: 0, color: `rgba(${rgb}, 0.05)` },
        { offset: 1, color: `rgba(${rgb}, 0.55)` },
      ],
});

/**
 * Diverging "river": new beneficiaries flow upward, returning ones downward from
 * a central year axis — the up/down balance reads the renewal mix at a glance.
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();

  const option = useMemo(() => {
    const rows = data ?? [];
    const years = rows.map((row) => String(row.anio));

    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          const total = row.nuevas + row.recurrentes;
          const pct = total > 0 ? Math.round((row.nuevas / total) * 100) : 0;
          return (
            ttTitle(String(row.anio)) +
            ttRow('Nuevas', formatInt(row.nuevas), COLOR_NEW) +
            ttRow('Recurrentes', formatInt(row.recurrentes), COLOR_RETURN) +
            ttRow('Total', formatInt(total)) +
            ttRow('Renovación', `${pct} %`)
          );
        },
      },
      legend: {
        bottom: 0,
        textStyle: { ...AXIS_LABEL, fontSize: 10 },
        icon: 'roundRect',
        itemWidth: 9,
        itemHeight: 9,
        data: ['Nuevas', 'Recurrentes'],
      },
      grid: { left: 8, right: 16, top: 18, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: years,
        boundaryGap: false,
        axisLabel: AXIS_LABEL,
        axisTick: { show: false },
        // Keep the year labels at the bottom, not on the centre (zero) line
        axisLine: { onZero: false, lineStyle: { color: '#e8e8ea' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          name: 'Nuevas',
          type: 'line' as const,
          smooth: 0.45,
          symbol: 'circle' as const,
          symbolSize: 6,
          showSymbol: false,
          data: rows.map((row) => row.nuevas),
          lineStyle: { width: 2, color: COLOR_NEW },
          itemStyle: { color: COLOR_NEW },
          areaStyle: { color: flow('79, 70, 229', false) },
          emphasis: { focus: 'series' as const },
          // Subtle central baseline drawn once
          markLine: {
            silent: true,
            symbol: 'none' as const,
            lineStyle: { color: '#d9d9dc', width: 1, type: 'solid' as const },
            label: { show: false },
            data: [{ yAxis: 0 }],
          },
          z: 3,
        },
        {
          name: 'Recurrentes',
          type: 'line' as const,
          smooth: 0.45,
          symbol: 'circle' as const,
          symbolSize: 6,
          showSymbol: false,
          data: rows.map((row) => -row.recurrentes),
          lineStyle: { width: 2, color: COLOR_RETURN },
          itemStyle: { color: COLOR_RETURN },
          areaStyle: { color: flow('13, 148, 136', true) },
          emphasis: { focus: 'series' as const },
          z: 2,
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <EChart option={option} className="h-96 w-full" />
    </Card>
  );
}
