import { useMemo, useState } from 'react';
import { useSeasonality } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, monoNum, SPLIT_LINE } from '../../lib/echarts';
import { formatInt, formatMoney, formatMoneyCompact, MONTH_LABELS } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Metrica = 'proyectos' | 'aportacion';

// Quarter-end months get a stronger color to surface end-of-period clustering
const QUARTER_END = new Set([3, 6, 9, 12]);

export function SeasonalityCard() {
  const [metrica, setMetrica] = useState<Metrica>('proyectos');
  const { data, isPending, isPlaceholderData } = useSeasonality();

  const option = useMemo(() => {
    const rows = data ?? [];
    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          return [
            `<b>${MONTH_LABELS[row.mes - 1]}</b>`,
            `Proyectos: <b>${monoNum(formatInt(row.proyectos))}</b>`,
            `Aportación: ${monoNum(formatMoney(row.aportacion))}`,
          ].join('<br/>');
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
          data: rows.map((row) => ({
            value: metrica === 'aportacion' ? row.aportacion : row.proyectos,
            itemStyle: { color: QUARTER_END.has(row.mes) ? '#4f46e5' : '#c7d2fe' },
          })),
          barWidth: '64%',
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: '#4338ca' } },
        },
      ],
    };
  }, [data, metrica]);

  return (
    <Card
      title="Estacionalidad de las resoluciones"
      subtitle="Aprobaciones por mes (todos los años); en color los cierres de trimestre"
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
