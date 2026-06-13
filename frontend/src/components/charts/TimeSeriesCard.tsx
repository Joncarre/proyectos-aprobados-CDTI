import { useMemo, useState } from 'react';
import type { TimeseriesPoint } from '@cdti/shared';
import { useTimeseries } from '../../api/queries';
import {
  AXIS_LABEL,
  baseTooltip,
  SPLIT_LINE,
  TIMESERIES_PALETTE,
  ttRow,
  ttTitle,
} from '../../lib/echarts';
import { formatMoneyCompact, formatPct } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Agrupar = 'ninguno' | 'ccaa' | 'area' | 'instrumento' | 'origen';
type Metrica = 'importes' | 'pct';

const MAX_GROUPS = 8;

const GROUP_OPTIONS = [
  { value: 'ninguno', label: 'Total' },
  { value: 'ccaa', label: 'CCAA' },
  { value: 'area', label: 'Área' },
  { value: 'instrumento', label: 'Instrumento' },
  { value: 'origen', label: 'Origen' },
] as const;

interface SeriesSpec {
  name: string;
  data: Array<number | null>;
  color?: string;
}

function buildSeries(
  points: TimeseriesPoint[],
  periods: string[],
  agrupar: Agrupar,
  metrica: Metrica,
): SeriesSpec[] {
  const indexByPeriod = new Map(periods.map((period, index) => [period, index]));

  if (agrupar === 'ninguno') {
    const presupuesto = new Array<number | null>(periods.length).fill(null);
    const aportacion = new Array<number | null>(periods.length).fill(null);
    const pct = new Array<number | null>(periods.length).fill(null);
    for (const point of points) {
      const index = indexByPeriod.get(point.periodo)!;
      presupuesto[index] = point.presupuesto;
      aportacion[index] = point.aportacion;
      pct[index] = point.pctMedio;
    }
    return metrica === 'pct'
      ? [{ name: '% medio de aportación', data: pct, color: TIMESERIES_PALETTE[0] }]
      : [
          { name: 'Presupuesto', data: presupuesto, color: '#8a94a6' },
          { name: 'Aportación CDTI', data: aportacion, color: TIMESERIES_PALETTE[0] },
        ];
  }

  // Grouped: one line per group, capped to the heaviest MAX_GROUPS by aportación
  const totals = new Map<string, number>();
  for (const point of points) {
    const group = point.grupo ?? '—';
    totals.set(group, (totals.get(group) ?? 0) + point.aportacion);
  }
  const top = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GROUPS)
    .map(([group]) => group);

  const series = new Map<string, Array<number | null>>(
    top.map((group) => [group, new Array<number | null>(periods.length).fill(null)]),
  );
  for (const point of points) {
    const data = series.get(point.grupo ?? '—');
    if (!data) continue;
    const index = indexByPeriod.get(point.periodo)!;
    data[index] = metrica === 'pct' ? point.pctMedio : point.aportacion;
  }
  return top.map((group, position) => ({
    name: group,
    data: series.get(group)!,
    color: TIMESERIES_PALETTE[position % TIMESERIES_PALETTE.length],
  }));
}

export function TimeSeriesCard() {
  const [agrupar, setAgrupar] = useState<Agrupar>('ninguno');
  const [metrica, setMetrica] = useState<Metrica>('importes');

  const { data, isPending, isPlaceholderData } = useTimeseries(
    'anio',
    agrupar === 'ninguno' ? undefined : agrupar,
  );

  const option = useMemo(() => {
    const points = data ?? [];
    const periods = [...new Set(points.map((point) => point.periodo))].sort();
    const series = buildSeries(points, periods, agrupar, metrica);

    const formatValue = (value: unknown): string =>
      typeof value !== 'number'
        ? '—'
        : metrica === 'pct'
          ? formatPct(value)
          : formatMoneyCompact(value);

    interface AxisItem {
      axisValueLabel?: string;
      color?: string;
      seriesName?: string;
      value?: unknown;
    }

    return {
      color: TIMESERIES_PALETTE,
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        formatter: (items: AxisItem[]) => {
          const list = Array.isArray(items) ? items : [items];
          return (
            ttTitle(list[0]?.axisValueLabel ?? '') +
            list
              .map((item) => ttRow(item.seriesName ?? '', formatValue(item.value), item.color))
              .join('')
          );
        },
      },
      legend: {
        type: 'scroll' as const,
        bottom: 0,
        textStyle: { ...AXIS_LABEL, fontSize: 10 },
        icon: 'roundRect',
        itemWidth: 9,
        itemHeight: 9,
      },
      grid: { left: 8, right: 16, top: 18, bottom: 30, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: periods,
        axisLabel: AXIS_LABEL,
        axisLine: { lineStyle: { color: '#2e3039' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          ...AXIS_LABEL,
          formatter: (value: number) =>
            metrica === 'pct' ? `${value} %` : formatMoneyCompact(value),
        },
        splitLine: SPLIT_LINE,
        max: metrica === 'pct' ? 100 : undefined,
      },
      series: series.map((spec) => ({
        name: spec.name,
        type: 'line' as const,
        data: spec.data,
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: true,
        connectNulls: false,
        lineStyle: { width: 1.5 },
        itemStyle: { color: spec.color },
        emphasis: { focus: 'series' as const },
        areaStyle: agrupar === 'ninguno' && metrica === 'importes' ? { opacity: 0.06 } : undefined,
      })),
    };
  }, [data, agrupar, metrica]);

  return (
    <Card
      title="Evolución temporal"
      subtitle={
        agrupar === 'ninguno'
          ? 'Presupuesto frente a aportación CDTI'
          : `Top ${MAX_GROUPS} grupos por aportación`
      }
      controls={
        <>
          <ControlGroup
            options={GROUP_OPTIONS}
            value={agrupar}
            onChange={setAgrupar}
            ariaLabel="Agrupar series por"
          />
          <ControlGroup
            options={[
              { value: 'importes', label: '€' },
              { value: 'pct', label: '%' },
            ]}
            value={metrica}
            onChange={setMetrica}
            ariaLabel="Métrica de la serie"
          />
        </>
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-80"
    >
      <EChart option={option} className="h-80 w-full" />
    </Card>
  );
}
