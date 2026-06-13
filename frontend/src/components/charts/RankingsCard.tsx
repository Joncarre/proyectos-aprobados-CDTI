import { useMemo, useState } from 'react';
import { useRankings } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, MONO_FONT, SPLIT_LINE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt, formatMoney, formatMoneyCompact, formatPct } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Por = 'instrumento' | 'area' | 'origen' | 'tipoAyuda';

const POR_OPTIONS = [
  { value: 'instrumento', label: 'Instrumento' },
  { value: 'area', label: 'Área' },
  { value: 'origen', label: 'Origen fondos' },
  { value: 'tipoAyuda', label: 'Tipo ayuda' },
] as const;

const TOP = 10;
const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export function RankingsCard() {
  const [por, setPor] = useState<Por>('instrumento');
  const { data, isPending, isPlaceholderData } = useRankings(por, TOP);

  const option = useMemo(() => {
    const rows = [...(data ?? [])].reverse(); // ECharts draws category 0 at the bottom
    return {
      tooltip: {
        ...baseTooltip,
        formatter: (params: { dataIndex: number }) => {
          const row = rows[params.dataIndex];
          if (!row) return '';
          return (
            ttTitle(row.categoria) +
            ttRow('Aportación CDTI', formatMoney(row.aportacion)) +
            ttRow('Proyectos', formatInt(row.proyectos)) +
            ttRow('% medio', formatPct(row.pctMedio))
          );
        },
      },
      grid: { left: 8, right: 48, top: 4, bottom: 4, containLabel: true },
      xAxis: {
        type: 'value' as const,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatMoneyCompact(value) },
        splitLine: SPLIT_LINE,
      },
      yAxis: {
        type: 'category' as const,
        data: rows.map((row) => row.categoria),
        axisLabel: {
          ...AXIS_LABEL,
          fontSize: 10,
          formatter: (value: string) => truncate(value, 26),
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: rows.map((row) => row.aportacion),
          barWidth: '62%',
          itemStyle: { color: '#4f46e5', borderRadius: [0, 4, 4, 0] },
          emphasis: { itemStyle: { color: '#4338ca' } },
          label: {
            show: true,
            position: 'right' as const,
            formatter: (params: { value: unknown }) => formatMoneyCompact(Number(params.value)),
            color: '#55555e',
            fontSize: 10,
            fontFamily: MONO_FONT,
          },
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Ranking por aportación CDTI"
      subtitle={`Top ${TOP} categorías`}
      controls={
        <ControlGroup
          options={POR_OPTIONS}
          value={por}
          onChange={setPor}
          ariaLabel="Dimensión del ranking"
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
