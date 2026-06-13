import { useMemo } from 'react';
import { useDistribution, useStats } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, MONO_FONT, monoNum, SPLIT_LINE } from '../../lib/echarts';
import { formatInt, formatPct } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const ANCHO = 5;

export function DistributionCard() {
  const { data, isPending, isPlaceholderData } = useDistribution(ANCHO);
  const { data: stats } = useStats();

  const option = useMemo(() => {
    const bins = data ?? [];
    const mean = stats?.pctMedio ?? null;
    // Plot each bin at its center on a 0–100 value axis so the curve spans the
    // full range and the axis closes at 100.
    const points = bins.map((bin) => [bin.desde + ANCHO / 2, bin.proyectos]);

    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'line' as const, lineStyle: { color: '#c7d2fe' } },
        formatter: (items: Array<{ dataIndex: number }>) => {
          const bin = bins[items[0]?.dataIndex ?? -1];
          if (!bin) return '';
          return `Aportación del <b>${monoNum(`${bin.desde}–${bin.hasta} %`)}</b><br/>Proyectos: <b>${monoNum(formatInt(bin.proyectos))}</b>`;
        },
      },
      grid: { left: 8, right: 16, top: 16, bottom: 4, containLabel: true },
      xAxis: {
        type: 'value' as const,
        min: 0,
        max: 100,
        interval: 10,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `${value}` },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
        name: '% de aportación',
        nameLocation: 'middle' as const,
        nameGap: 30,
        nameTextStyle: { color: '#a1a1aa', fontSize: 10, fontFamily: MONO_FONT },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatInt(value) },
        splitLine: SPLIT_LINE,
      },
      series: [
        {
          type: 'line' as const,
          data: points,
          smooth: 0.45,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#4f46e5' },
          itemStyle: { color: '#4f46e5', borderColor: '#ffffff', borderWidth: 2 },
          emphasis: { focus: 'series' as const, scale: 1.4 },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(79, 70, 229, 0.32)' },
                { offset: 1, color: 'rgba(79, 70, 229, 0.02)' },
              ],
            },
          },
          markLine:
            mean !== null
              ? {
                  symbol: ['none', 'none'] as [string, string],
                  silent: true,
                  lineStyle: { color: '#4338ca', type: 'dashed' as const, width: 1.5 },
                  label: {
                    formatter: `Media ${formatPct(mean)}`,
                    position: 'end' as const,
                    color: '#ffffff',
                    backgroundColor: '#4338ca',
                    padding: [3, 6] as [number, number],
                    borderRadius: 4,
                    fontFamily: MONO_FONT,
                    fontSize: 10,
                    fontWeight: 'bold' as const,
                  },
                  data: [{ xAxis: mean }],
                }
              : undefined,
        },
      ],
    };
  }, [data, stats]);

  return (
    <Card
      title="Distribución del % de aportación"
      subtitle={
        stats?.pctMedio != null
          ? `Media del conjunto filtrado: ${formatPct(stats.pctMedio)}`
          : undefined
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-80"
    >
      <EChart option={option} className="h-80 w-full" />
    </Card>
  );
}
