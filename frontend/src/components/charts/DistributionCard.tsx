import { useMemo, useState } from 'react';
import { useDistribution, useStats } from '../../api/queries';
import {
  AXIS_LABEL,
  baseTooltip,
  MONO_FONT,
  monoNum,
  SERIES_PALETTE,
  SPLIT_LINE,
} from '../../lib/echarts';
import { formatInt, formatPct } from '../../lib/format';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Desglose = 'ninguno' | 'tipoAyuda' | 'instrumento';

const BIN_WIDTH = 5;

const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export function DistributionCard() {
  const [desglose, setDesglose] = useState<Desglose>('ninguno');
  const { data, isPending, isPlaceholderData } = useDistribution(desglose);
  const { data: stats } = useStats();

  const option = useMemo(() => {
    const series = data?.series ?? [];
    const aggregate = desglose === 'ninguno';
    const mean = stats?.pctMedio ?? null;

    const toPoints = (bins: number[]): number[][] =>
      bins.map((count, index) => [index * BIN_WIDTH + BIN_WIDTH / 2, count]);

    return {
      color: SERIES_PALETTE,
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'line' as const, lineStyle: { color: '#c7d2fe' } },
        formatter: (items: Array<{ seriesName?: string; value?: number[]; color?: string }>) => {
          const list = Array.isArray(items) ? items : [items];
          const x = list[0]?.value?.[0];
          if (typeof x !== 'number') return '';
          const desde = x - BIN_WIDTH / 2;
          const header = `<b>${monoNum(`${desde}–${desde + BIN_WIDTH} %`)}</b>`;
          const lines = list.map((item) => {
            const count = item.value?.[1] ?? 0;
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${item.color};margin-right:5px"></span>`;
            return aggregate
              ? `Proyectos: <b>${monoNum(formatInt(count))}</b>`
              : `${dot}${item.seriesName}: ${monoNum(formatInt(count))}`;
          });
          return [header, ...lines].join('<br/>');
        },
      },
      legend: aggregate
        ? undefined
        : {
            type: 'scroll' as const,
            bottom: 0,
            textStyle: { ...AXIS_LABEL, fontSize: 10 },
            icon: 'roundRect',
            itemWidth: 9,
            itemHeight: 9,
          },
      grid: { left: 8, right: 16, top: 16, bottom: aggregate ? 4 : 28, containLabel: true },
      xAxis: {
        type: 'value' as const,
        min: 0,
        max: 100,
        interval: 10,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => `${value}` },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e8e8ea' } },
        // Hidden when a legend occupies the bottom (decomposed mode)
        name: aggregate ? '% de aportación' : '',
        nameLocation: 'middle' as const,
        nameGap: 30,
        nameTextStyle: { color: '#a1a1aa', fontSize: 10, fontFamily: MONO_FONT },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { ...AXIS_LABEL, formatter: (value: number) => formatInt(value) },
        splitLine: SPLIT_LINE,
      },
      series: series.map((spec, index) => {
        const color = aggregate ? '#4f46e5' : SERIES_PALETTE[index % SERIES_PALETTE.length];
        return {
          name: aggregate ? 'Proyectos' : truncate(spec.categoria, 32),
          type: 'line' as const,
          data: toPoints(spec.bins),
          smooth: 0.45,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: false,
          lineStyle: { width: 1.75, color },
          itemStyle: { color, borderColor: '#ffffff', borderWidth: 2 },
          emphasis: { focus: 'series' as const, scale: 1.4 },
          areaStyle:
            aggregate || series.length <= 2
              ? {
                  opacity: aggregate ? 1 : 0.12,
                  color: aggregate
                    ? {
                        type: 'linear' as const,
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(79, 70, 229, 0.32)' },
                          { offset: 1, color: 'rgba(79, 70, 229, 0.02)' },
                        ],
                      }
                    : color,
                }
              : undefined,
          markLine:
            aggregate && mean !== null
              ? {
                  symbol: ['none', 'none'] as [string, string],
                  silent: true,
                  lineStyle: { color: '#a5b4fc', type: 'dashed' as const, width: 1 },
                  label: {
                    formatter: `Media ${formatPct(mean)}`,
                    position: 'end' as const,
                    color: '#6366f1',
                    fontFamily: MONO_FONT,
                    fontSize: 10,
                  },
                  data: [{ xAxis: mean }],
                }
              : undefined,
        };
      }),
    };
  }, [data, desglose, stats]);

  const subtitle = useMemo(() => {
    if (desglose === 'ninguno') {
      return stats?.pctMedio != null
        ? `Media del conjunto filtrado: ${formatPct(stats.pctMedio)}`
        : undefined;
    }
    if (desglose === 'instrumento') {
      return 'Intensidad de la ayuda por instrumento (top 6)';
    }
    // tipoAyuda: only two series, their means fit on one line
    const means = (data?.series ?? [])
      .filter((serie) => serie.pctMedio !== null)
      .map((serie) => `${truncate(serie.categoria, 28)} ~${serie.pctMedio} %`);
    return means.join(' · ') || undefined;
  }, [desglose, data, stats]);

  return (
    <Card
      title="Distribución del % de aportación"
      subtitle={subtitle}
      controls={
        <ControlGroup
          options={[
            { value: 'ninguno', label: 'Total' },
            { value: 'tipoAyuda', label: 'Tipo de ayuda' },
            { value: 'instrumento', label: 'Instrumento' },
          ]}
          value={desglose}
          onChange={setDesglose}
          ariaLabel="Desglose de la distribución"
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
