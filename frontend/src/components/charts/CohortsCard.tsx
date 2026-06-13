import { useMemo } from 'react';
import { useCohorts } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, monoNum, SPLIT_LINE } from '../../lib/echarts';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const COLOR_NEW = '#4f46e5';
const COLOR_RETURN = '#94a3b8';
const COLOR_RATE = '#0d9488';

/** New vs returning beneficiaries per year + the renewal rate (% new). */
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
        axisPointer: { type: 'shadow' as const },
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          const total = row.nuevas + row.recurrentes;
          return [
            `<b>${row.anio}</b>`,
            `<span style="color:${COLOR_NEW}">●</span> Nuevas: <b>${monoNum(formatInt(row.nuevas))}</b>`,
            `<span style="color:${COLOR_RETURN}">●</span> Recurrentes: <b>${monoNum(formatInt(row.recurrentes))}</b>`,
            `Renovación: ${monoNum(`${total > 0 ? Math.round((row.nuevas / total) * 100) : 0} %`)}`,
          ].join('<br/>');
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
      grid: { left: 8, right: 8, top: 16, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: years,
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
          axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `${value}%` },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Nuevas',
          type: 'bar' as const,
          stack: 'empresas',
          data: rows.map((row) => row.nuevas),
          itemStyle: { color: COLOR_NEW, borderRadius: [0, 0, 0, 0] },
          barWidth: '58%',
        },
        {
          name: 'Recurrentes',
          type: 'bar' as const,
          stack: 'empresas',
          data: rows.map((row) => row.recurrentes),
          itemStyle: { color: COLOR_RETURN, borderRadius: [3, 3, 0, 0] },
        },
        {
          name: '% renovación',
          type: 'line' as const,
          yAxisIndex: 1,
          data: rate,
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: COLOR_RATE },
          itemStyle: { color: COLOR_RATE },
          z: 3,
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda CDTI del histórico (desde 2014) frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-80"
    >
      <EChart option={option} className="h-80 w-full" />
    </Card>
  );
}
