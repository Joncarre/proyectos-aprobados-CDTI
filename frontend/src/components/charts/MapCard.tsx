import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { GeoRow, MetaResponse } from '@cdti/shared';
import { useGeo } from '../../api/queries';
import { baseTooltip, MONO_FONT, monoNum, SEQUENTIAL_RAMP } from '../../lib/echarts';
import { CCAA_MAP, PROVINCIAS_MAP, registerSpainMaps } from '../../lib/geo';
import { formatInt, formatMoney, formatPct } from '../../lib/format';
import { useFiltersStore } from '../../state/filters';
import { Card, ControlGroup } from '../ui/Card';
import { EChart } from './EChart';

type Metric = 'proyectos' | 'aportacion' | 'pctMedio';
type Nivel = 'ccaa' | 'provincia';

const METRIC_OPTIONS = [
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'aportacion', label: 'Aportación' },
  { value: 'pctMedio', label: '% medio' },
] as const;

interface Region {
  name: string;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

/** Merge geo rows by region name (some source rows carry inconsistent CCAA pairs). */
function mergeRegions(rows: GeoRow[], nivel: Nivel): Region[] {
  const byName = new Map<string, Region>();
  for (const row of rows) {
    const name = nivel === 'ccaa' ? row.ccaa : (row.provincia ?? row.ccaa);
    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, { name, ...row, pctMedio: row.pctMedio });
      continue;
    }
    const totalProyectos = existing.proyectos + row.proyectos;
    existing.pctMedio =
      existing.pctMedio !== null && row.pctMedio !== null
        ? (existing.pctMedio * existing.proyectos + row.pctMedio * row.proyectos) / totalProyectos
        : (existing.pctMedio ?? row.pctMedio);
    existing.proyectos = totalProyectos;
    existing.presupuesto += row.presupuesto;
    existing.aportacion += row.aportacion;
  }
  return [...byName.values()];
}

export function MapCard({ meta }: { meta: MetaResponse }) {
  const [nivel, setNivel] = useState<Nivel>('ccaa');
  const [metric, setMetric] = useState<Metric>('aportacion');
  const setArray = useFiltersStore((state) => state.setArray);
  const toggleValue = useFiltersStore((state) => state.toggleValue);

  useEffect(() => {
    registerSpainMaps(meta.options.ccaa, [
      ...new Set(meta.options.provincias.map((entry) => entry.provincia)),
    ]);
  }, [meta]);

  const { data, isPending, isPlaceholderData } = useGeo(nivel);
  const regions = useMemo(() => mergeRegions(data ?? [], nivel), [data, nivel]);

  const maxValue = Math.max(1, ...regions.map((region) => Number(region[metric] ?? 0)));

  const option = useMemo(
    () => ({
      tooltip: {
        ...baseTooltip,
        formatter: (params: { name: string; data?: { region?: Region } }) => {
          const region = params.data?.region;
          if (!region) return `<b>${params.name}</b><br/>Sin proyectos con los filtros activos`;
          return [
            `<b>${region.name}</b>`,
            `Proyectos: <b>${monoNum(formatInt(region.proyectos))}</b>`,
            `Presupuesto: ${monoNum(formatMoney(region.presupuesto))}`,
            `Aportación CDTI: ${monoNum(formatMoney(region.aportacion))}`,
            `% medio de aportación: ${monoNum(formatPct(region.pctMedio))}`,
          ].join('<br/>');
        },
      },
      visualMap: {
        type: 'continuous' as const,
        min: 0,
        max: maxValue,
        inRange: { color: SEQUENTIAL_RAMP },
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 360,
        text: ['', ''],
        formatter: (value: number) =>
          metric === 'pctMedio'
            ? `${Math.round(value)} %`
            : metric === 'aportacion'
              ? `${Math.round(value / 1e6)} M€`
              : formatInt(Math.round(value)),
        textStyle: { color: '#55555e', fontSize: 10, fontFamily: MONO_FONT },
      },
      series: [
        {
          type: 'map' as const,
          map: nivel === 'ccaa' ? CCAA_MAP : PROVINCIAS_MAP,
          roam: false,
          selectedMode: false,
          itemStyle: { areaColor: '#f4f4f5', borderColor: '#d9d9dc', borderWidth: 0.6 },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#fbbf24', borderColor: '#d97706' },
          },
          label: { show: false },
          data: regions.map((region) => ({
            name: region.name,
            value: Number(region[metric] ?? 0),
            region,
          })),
        },
      ],
    }),
    [regions, metric, nivel, maxValue],
  );

  const handleClick = (params: { name: string }): void => {
    if (nivel === 'ccaa') {
      // Drill-down: focus the clicked CCAA via the global filter and show its provinces
      if (meta.options.ccaa.includes(params.name)) {
        setArray('ccaa', [params.name]);
        setNivel('provincia');
      }
    } else {
      const known = meta.options.provincias.some((entry) => entry.provincia === params.name);
      if (known) toggleValue('provincias', params.name);
    }
  };

  return (
    <Card
      title="Mapa de España"
      subtitle={
        nivel === 'ccaa'
          ? 'Clic en una comunidad para bajar a sus provincias'
          : 'Clic en una provincia para filtrar por ella'
      }
      controls={
        <>
          {nivel === 'provincia' && (
            <button
              type="button"
              onClick={() => setNivel('ccaa')}
              className="group shadow-card flex items-center gap-1.5 rounded-lg border border-accent-line bg-accent-soft px-2.5 py-1 text-[0.7rem] font-medium text-accent-strong transition-all duration-200 hover:-translate-y-px hover:shadow-pop active:translate-y-0 active:scale-95"
            >
              <ArrowLeft className="size-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Atrás
            </button>
          )}
          <ControlGroup
            options={METRIC_OPTIONS}
            value={metric}
            onChange={setMetric}
            ariaLabel="Métrica del mapa"
          />
        </>
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-[34rem]"
    >
      <EChart option={option} className="h-[34rem] w-full" onClick={handleClick} />
    </Card>
  );
}
