import { useMemo } from 'react';
import { useCohorts } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, MONO_FONT, SPLIT_LINE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const COLOR_NEW = '#4f46e5';
const COLOR_RETURN = '#a5b4fc';
const COLOR_RATE = '#0d9488';

/** Vertical fade used under each cohort band. */
const areaGradient = (rgb: string) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(${rgb}, 0.5)` },
    { offset: 1, color: `rgba(${rgb}, 0.04)` },
  ],
});

/** New vs returning beneficiaries per year as stacked gradient bands, with the
 * renewal rate (% new) as the hero line. */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();

  const option = useMemo(() => {
    const rows = data ?? [];
    const years = rows.map((row) => String(row.anio));
    const rate = rows.map((row) => {
      const total = row.nuevas + row.recurrentes;
      return total > 0 ? Math.round((row.nuevas / total) * 100) : 0;
    });

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
            ttRow('Renovación', `${pct} %`, COLOR_RATE)
          );
        },
      },
      legend: {
        bottom: 0,
        textStyle: { ...AXIS_LABEL, fontSize: 10 },
        icon: 'roundRect',
        itemWidth: 9,
        itemHeight: 9,
        data: ['Nuevas', 'Recurrentes', '% renovación'],
      },
      grid: { left: 8, right: 40, top: 18, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: years,
        boundaryGap: false,
        axisLabel: AXIS_LABEL,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
      },
      yAxis: [
        {
          type: 'value' as const,
          axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatInt(value) },
          splitLine: SPLIT_LINE,
        },
        {
          type: 'value' as const,
          min: 0,
          max: 100,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Nuevas',
          type: 'line' as const,
          stack: 'empresas',
          smooth: 0.35,
          symbol: 'none' as const,
          data: rows.map((row) => row.nuevas),
          lineStyle: { width: 2, color: COLOR_NEW },
          itemStyle: { color: COLOR_NEW },
          areaStyle: { color: areaGradient('79, 70, 229') },
          emphasis: { focus: 'series' as const },
          z: 2,
        },
        {
          name: 'Recurrentes',
          type: 'line' as const,
          stack: 'empresas',
          smooth: 0.35,
          symbol: 'none' as const,
          data: rows.map((row) => row.recurrentes),
          lineStyle: { width: 2, color: COLOR_RETURN },
          itemStyle: { color: COLOR_RETURN },
          areaStyle: { color: areaGradient('165, 180, 252') },
          emphasis: { focus: 'series' as const },
          z: 1,
        },
        {
          name: '% renovación',
          type: 'line' as const,
          yAxisIndex: 1,
          smooth: 0.35,
          data: rate,
          symbol: 'circle' as const,
          symbolSize: 6,
          lineStyle: {
            width: 2.5,
            color: COLOR_RATE,
            shadowColor: 'rgba(13, 148, 136, 0.35)',
            shadowBlur: 8,
            shadowOffsetY: 2,
          },
          itemStyle: { color: COLOR_RATE, borderColor: '#ffffff', borderWidth: 1.5 },
          endLabel: {
            show: true,
            formatter: (params: { value: number }) => `${params.value}%`,
            color: COLOR_RATE,
            fontFamily: MONO_FONT,
            fontSize: 11,
            fontWeight: 'bold' as const,
          },
          emphasis: { focus: 'series' as const },
          z: 5,
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
