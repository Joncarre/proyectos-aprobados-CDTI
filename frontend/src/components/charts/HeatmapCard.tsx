import { useMemo, useState } from 'react';
import { useHeatmap } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, MONO_FONT, monoNum, SEQUENTIAL_RAMP } from '../../lib/echarts';
import { formatInt, formatMoney, formatMoneyCompact, formatPct } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Dim = 'area' | 'ccaa';
type Metrica = 'aportacion' | 'proyectos';

const MAX_ROWS = 14;
const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export function HeatmapCard() {
  const [dim, setDim] = useState<Dim>('area');
  const [metrica, setMetrica] = useState<Metrica>('aportacion');
  const { data, isPending, isPlaceholderData } = useHeatmap(dim);

  const { option, totalCategories } = useMemo(() => {
    const cells = data ?? [];
    const anios = [...new Set(cells.map((cell) => cell.anio))].sort();

    const totals = new Map<string, number>();
    for (const cell of cells) {
      totals.set(cell.categoria, (totals.get(cell.categoria) ?? 0) + cell[metrica]);
    }
    const categories = [...totals.entries()]
      .sort((a, b) => a[1] - b[1]) // ascending: heaviest row on top of the Y axis
      .slice(-MAX_ROWS)
      .map(([name]) => name);

    const anioIndex = new Map(anios.map((anio, index) => [anio, index]));
    const catIndex = new Map(categories.map((name, index) => [name, index]));
    const points = cells
      .filter((cell) => catIndex.has(cell.categoria))
      .map((cell) => ({
        value: [anioIndex.get(cell.anio)!, catIndex.get(cell.categoria)!, cell[metrica]],
        cell,
      }));
    const maxValue = Math.max(1, ...points.map((point) => Number(point.value[2])));

    return {
      totalCategories: totals.size,
      option: {
        tooltip: {
          ...baseTooltip,
          formatter: (params: { data?: { cell?: (typeof cells)[number] } }) => {
            const cell = params.data?.cell;
            if (!cell) return '';
            return [
              `<b>${cell.categoria}</b> · ${cell.anio}`,
              `Proyectos: <b>${monoNum(formatInt(cell.proyectos))}</b>`,
              `Aportación CDTI: ${monoNum(formatMoney(cell.aportacion))}`,
              `% medio: ${monoNum(formatPct(cell.pctMedio))}`,
            ].join('<br/>');
          },
        },
        grid: { left: 8, right: 60, top: 8, bottom: 28, containLabel: true },
        xAxis: {
          type: 'category' as const,
          data: anios.map(String),
          axisLabel: AXIS_LABEL,
          axisTick: { show: false },
          axisLine: { show: false },
          splitArea: { show: false },
        },
        yAxis: {
          type: 'category' as const,
          data: categories,
          axisLabel: {
            ...AXIS_LABEL,
            fontSize: 10,
            formatter: (value: string) => truncate(value, 28),
          },
          axisTick: { show: false },
          axisLine: { show: false },
        },
        visualMap: {
          type: 'continuous' as const,
          min: 0,
          max: maxValue,
          inRange: { color: SEQUENTIAL_RAMP },
          orient: 'vertical' as const,
          right: 0,
          top: 'center',
          itemWidth: 10,
          itemHeight: 110,
          formatter: (value: number) =>
            metrica === 'aportacion' ? formatMoneyCompact(value) : formatInt(Math.round(value)),
          textStyle: { color: '#55555e', fontSize: 9, fontFamily: MONO_FONT },
        },
        series: [
          {
            type: 'heatmap' as const,
            data: points,
            itemStyle: { borderColor: '#ffffff', borderWidth: 1.5, borderRadius: 3 },
            emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgb(26 26 30 / 0.3)' } },
          },
        ],
      },
    };
  }, [data, metrica]);

  return (
    <Card
      title={`Heatmap año × ${dim === 'area' ? 'área sectorial' : 'CCAA'}`}
      subtitle={
        totalCategories > MAX_ROWS
          ? `Top ${MAX_ROWS} de ${totalCategories} categorías por ${metrica === 'aportacion' ? 'aportación' : 'nº de proyectos'}`
          : undefined
      }
      controls={
        <>
          <ControlGroup
            options={[
              { value: 'area', label: 'Área sectorial' },
              { value: 'ccaa', label: 'CCAA' },
            ]}
            value={dim}
            onChange={setDim}
            ariaLabel="Dimensión del heatmap"
          />
          <ControlGroup
            options={[
              { value: 'aportacion', label: 'Aportación' },
              { value: 'proyectos', label: 'Proyectos' },
            ]}
            value={metrica}
            onChange={setMetrica}
            ariaLabel="Métrica del heatmap"
          />
        </>
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <EChart option={option} className="h-96 w-full" />
    </Card>
  );
}
