import { useMemo, useState } from 'react';
import { useDistribution, useStats } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, monoNum, SPLIT_LINE } from '../../lib/echarts';
import { formatInt, formatPct } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

export function DistributionCard() {
  const [ancho, setAncho] = useState<5 | 10>(5);
  const { data, isPending, isPlaceholderData } = useDistribution(ancho);
  const { data: stats } = useStats();

  const option = useMemo(() => {
    const bins = data ?? [];
    return {
      tooltip: {
        ...baseTooltip,
        formatter: (params: { dataIndex: number }) => {
          const bin = bins[params.dataIndex];
          if (!bin) return '';
          return `Aportación del <b>${monoNum(`${bin.desde}–${bin.hasta} %`)}</b><br/>Proyectos: <b>${monoNum(formatInt(bin.proyectos))}</b>`;
        },
      },
      grid: { left: 8, right: 16, top: 12, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: bins.map((bin) => `${bin.desde}`),
        axisLabel: { ...AXIS_LABEL, interval: ancho === 5 ? 1 : 0 },
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
        name: '% de aportación',
        nameLocation: 'middle' as const,
        nameGap: 28,
        nameTextStyle: { color: '#9b9ba3', fontSize: 10 },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatInt(value) },
        splitLine: SPLIT_LINE,
      },
      series: [
        {
          type: 'bar' as const,
          data: bins.map((bin) => bin.proyectos),
          barWidth: '78%',
          itemStyle: { color: '#818cf8', borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: '#4f46e5' } },
        },
      ],
    };
  }, [data, ancho]);

  return (
    <Card
      title="Distribución del % de aportación"
      subtitle={
        stats?.pctMedio != null
          ? `Media del conjunto filtrado: ${formatPct(stats.pctMedio)}`
          : undefined
      }
      controls={
        <ControlGroup
          options={[
            { value: '5', label: 'Bins de 5' },
            { value: '10', label: 'Bins de 10' },
          ]}
          value={String(ancho) as '5' | '10'}
          onChange={(value) => setAncho(Number(value) as 5 | 10)}
          ariaLabel="Ancho de los bins"
        />
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-80"
    >
      <EChart option={option} className="h-80 w-full" />
    </Card>
  );
}
