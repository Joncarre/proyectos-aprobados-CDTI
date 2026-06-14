import { useMemo, useState } from 'react';
import { useSeasonality } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, SPLIT_LINE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt, formatMoney, formatMoneyCompact, MONTH_LABELS } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Metrica = 'proyectos' | 'aportacion';

export function SeasonalityCard() {
  const [metrica, setMetrica] = useState<Metrica>('proyectos');
  const { data, isPending, isPlaceholderData } = useSeasonality();

  const option = useMemo(() => {
    const rows = data ?? [];
    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        // Barely-there hover band (the default shadow is too dark)
        axisPointer: {
          type: 'shadow' as const,
          shadowStyle: { color: 'rgba(100, 116, 139, 0.07)' },
        },
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          return (
            ttTitle(MONTH_LABELS[row.mes - 1] ?? '') +
            ttRow('Proyectos', formatInt(row.proyectos)) +
            ttRow('Aportación', formatMoney(row.aportacion))
          );
        },
      },
      grid: { left: 8, right: 12, top: 16, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: rows.map((row) => MONTH_LABELS[row.mes - 1]),
        axisLabel: AXIS_LABEL,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          ...AXIS_LABEL,
          formatter: (value: number) =>
            metrica === 'aportacion' ? formatMoneyCompact(value) : formatInt(value),
        },
        splitLine: SPLIT_LINE,
      },
      series: [
        {
          type: 'bar' as const,
          data: rows.map((row) => (metrica === 'aportacion' ? row.aportacion : row.proyectos)),
          barWidth: '56%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#a9cdf3' },
                { offset: 1, color: '#d8e9fb' },
              ],
            },
          },
          showBackground: true,
          backgroundStyle: { color: 'rgba(169, 205, 243, 0.12)', borderRadius: [6, 6, 0, 0] },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#86b6ef' },
                  { offset: 1, color: '#bcdcf9' },
                ],
              },
              shadowBlur: 12,
              shadowColor: 'rgba(134, 182, 239, 0.55)',
            },
          },
        },
      ],
    };
  }, [data, metrica]);

  return (
    <Card
      title="Estacionalidad de las resoluciones"
      subtitle="Aprobaciones por mes"
      controls={
        <ControlGroup
          options={[
            { value: 'proyectos', label: 'Proyectos' },
            { value: 'aportacion', label: 'Aportación' },
          ]}
          value={metrica}
          onChange={setMetrica}
          ariaLabel="Métrica de la estacionalidad"
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
