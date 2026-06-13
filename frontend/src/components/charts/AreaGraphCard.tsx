import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { TreemapRow } from '@cdti/shared';
import { useTreemap } from '../../api/queries';
import { baseTooltip, MONO_FONT, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt, formatMoney } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart, type EChartClickParams } from './EChart';

const HUB_ID = '__hub';
const MAX_AREAS = 16; // keep the graph legible
const MAX_INSTRUMENTS = 12;

interface NodeAgg {
  name: string;
  aportacion: number;
  proyectos: number;
}

const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

/** Linear interpolation between two #rrggbb colors. */
function lerpHex(from: string, to: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
  const mix = a.map((channel, i) => Math.round(channel + (b[i]! - channel) * t));
  return `#${mix.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Bubble radius ∝ √value so the node area is proportional to the contribution. */
const sizeOf = (value: number, max: number, min = 22, maxPx = 90): number =>
  min + (max > 0 ? Math.sqrt(value) / Math.sqrt(max) : 0) * (maxPx - min);

function aggregateAreas(rows: TreemapRow[]): NodeAgg[] {
  const byArea = new Map<string, NodeAgg>();
  for (const row of rows) {
    const entry = byArea.get(row.area) ?? { name: row.area, aportacion: 0, proyectos: 0 };
    entry.aportacion += row.aportacion;
    entry.proyectos += row.proyectos;
    byArea.set(row.area, entry);
  }
  return [...byArea.values()].sort((a, b) => b.aportacion - a.aportacion);
}

interface GraphSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links: any[];
}

/** Builds a hub-and-spoke graph: a central node linked to value-sized leaves. */
function buildGraph(
  hubName: string,
  hubColor: string,
  leaves: NodeAgg[],
  ramp: [string, string],
): GraphSpec {
  const max = Math.max(1, ...leaves.map((leaf) => leaf.aportacion));
  const nodes = [
    {
      id: HUB_ID,
      name: hubName,
      symbolSize: 42,
      value: leaves.reduce((sum, leaf) => sum + leaf.aportacion, 0),
      itemStyle: { color: hubColor, borderColor: '#ffffff', borderWidth: 2 },
      label: {
        show: true,
        position: 'inside',
        color: '#ffffff',
        fontSize: 9,
        fontFamily: MONO_FONT,
        width: 56,
        overflow: 'truncate',
        formatter: () => truncate(hubName, 18),
      },
      tooltipKind: 'hub' as const,
    },
    ...leaves.map((leaf) => {
      const t = Math.sqrt(leaf.aportacion) / Math.sqrt(max);
      const color = lerpHex(ramp[0], ramp[1], t);
      return {
        id: leaf.name,
        name: leaf.name,
        value: leaf.aportacion,
        proyectos: leaf.proyectos,
        symbolSize: sizeOf(leaf.aportacion, max),
        itemStyle: {
          color,
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 16,
          shadowColor: `${color}66`,
        },
        label: {
          show: true,
          position: 'bottom',
          distance: 5,
          color: '#52525b',
          fontSize: 9,
          fontFamily: MONO_FONT,
          formatter: () => truncate(leaf.name, 18),
        },
        tooltipKind: 'leaf' as const,
      };
    }),
  ];

  const links = leaves.map((leaf) => ({
    source: HUB_ID,
    target: leaf.name,
    lineStyle: { color: lerpHex(ramp[0], ramp[1], 0.5), opacity: 0.16, curveness: 0.08, width: 1 },
  }));

  return { nodes, links };
}

export function AreaGraphCard() {
  const { data, isPending, isPlaceholderData } = useTreemap();
  const [area, setArea] = useState<string | null>(null);

  const areas = useMemo(() => aggregateAreas(data ?? []), [data]);
  const areaNames = useMemo(() => new Set(areas.map((a) => a.name)), [areas]);

  // Drill level: areas (indigo ramp) or the instruments of the selected area (teal ramp)
  const graph = useMemo(() => {
    if (area) {
      const instruments: NodeAgg[] = (data ?? [])
        .filter((row) => row.area === area)
        .map((row) => ({
          name: row.instrumento,
          aportacion: row.aportacion,
          proyectos: row.proyectos,
        }))
        .sort((a, b) => b.aportacion - a.aportacion)
        .slice(0, MAX_INSTRUMENTS);
      return buildGraph(area, '#0f766e', instruments, ['#99f6e4', '#0f766e']);
    }
    return buildGraph('Áreas', '#312e81', areas.slice(0, MAX_AREAS), ['#c7d2fe', '#3730a3']);
  }, [area, areas, data]);

  const option = useMemo(
    () => ({
      tooltip: {
        ...baseTooltip,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (params.dataType !== 'node') return '';
          const node = params.data;
          if (node.tooltipKind === 'hub') {
            return ttTitle(node.name) + ttRow('Aportación total', formatMoney(node.value));
          }
          return (
            ttTitle(node.name) +
            ttRow('Aportación CDTI', formatMoney(node.value)) +
            ttRow('Proyectos', formatInt(node.proyectos))
          );
        },
      },
      series: [
        {
          type: 'graph' as const,
          layout: 'force' as const,
          roam: true,
          draggable: true,
          scaleLimit: { min: 0.5, max: 3 },
          force: { repulsion: 460, edgeLength: 180, gravity: 0.07, friction: 0.16 },
          nodes: graph.nodes,
          links: graph.links,
          labelLayout: { hideOverlap: true },
          emphasis: {
            focus: 'adjacency' as const,
            scale: 1.06,
            label: { fontSize: 10, fontWeight: 'bold' as const, color: '#18181b' },
            itemStyle: { shadowBlur: 26 },
          },
          lineStyle: { color: 'source' as const },
          animationDuration: 900,
          animationEasingUpdate: 'quinticInOut' as const,
        },
      ],
    }),
    [graph],
  );

  const handleClick = (params: EChartClickParams): void => {
    if (!area && areaNames.has(params.name)) setArea(params.name);
  };

  return (
    <Card
      title="Áreas sectoriales → instrumentos"
      subtitle={
        area
          ? `Instrumentos de ${truncate(area, 40)}`
          : 'Pulsa un área para ver sus instrumentos · el tamaño indica la aportación'
      }
      controls={
        area ? (
          <button
            type="button"
            onClick={() => setArea(null)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition duration-200 hover:border-accent-line hover:bg-accent-soft hover:text-accent-strong hover:shadow-card"
          >
            <ArrowLeft className="size-3.5" />
            Atrás
          </button>
        ) : undefined
      }
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-[34rem]"
    >
      <EChart option={option} className="h-[34rem] w-full" onClick={handleClick} />
    </Card>
  );
}
