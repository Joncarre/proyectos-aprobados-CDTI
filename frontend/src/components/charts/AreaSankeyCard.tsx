import { useMemo } from 'react';
import type { TreemapRow } from '@cdti/shared';
import { useTreemap } from '../../api/queries';
import { baseTooltip, MONO_FONT, TIMESERIES_PALETTE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt, formatMoney } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const MAX_AREAS = 9;
const MAX_INSTRUMENTS = 8;
// Zero-width space appended to instrument node ids so they never collide with an
// area that happens to share the same label (Sankey nodes are keyed by name).
const ZWS = String.fromCharCode(0x200b);
const ZWS_RE = new RegExp(ZWS, 'g');

// Areas stay neutral (grey, darker with weight); instruments carry the colour,
// matched by rank to the Evolución temporal palette so the same instrument
// shares its colour across both panels.
const AREA_RAMP: [string, string] = ['#c9cace', '#4b4c54'];
const LABEL_COLOR = '#3f3f46';

const truncate = (value: string, length: number): string =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const clean = (value: string): string => value.replace(ZWS_RE, '');

/** Linear interpolation between two #rrggbb colors. */
function lerpHex(from: string, to: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
  const mix = a.map((channel, i) => Math.round(channel + (b[i]! - channel) * t));
  return `#${mix.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

interface Agg {
  name: string;
  aportacion: number;
  proyectos: number;
}

/** Sum aportación/proyectos by a key and return the entries sorted desc. */
function aggregate(rows: TreemapRow[], key: (row: TreemapRow) => string): Agg[] {
  const byKey = new Map<string, Agg>();
  for (const row of rows) {
    const name = key(row);
    const entry = byKey.get(name) ?? { name, aportacion: 0, proyectos: 0 };
    entry.aportacion += row.aportacion;
    entry.proyectos += row.proyectos;
    byKey.set(name, entry);
  }
  return [...byKey.values()].sort((a, b) => b.aportacion - a.aportacion);
}

/** Maps a value to a ramp color by its position within the [min, max] range. */
function rampFor(values: number[], ramp: [string, string]): (value: number) => string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return (value) => lerpHex(ramp[0], ramp[1], max === min ? 0.6 : (value - min) / (max - min));
}

interface SankeyNode {
  name: string;
  value: number;
  proyectos: number;
  depth: number;
  itemStyle: { color: string; borderWidth: number };
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  proyectos: number;
}

/**
 * Flow of CDTI funding from each sectoral area to its funding instruments,
 * rendered as a Sankey: areas on the left, instruments on the right, ribbon
 * thickness ∝ aportación and a two-tone (indigo→teal) gradient per flow.
 * Hovering focuses an area or instrument and its connected ribbons.
 */
export function AreaSankeyCard() {
  const { data, isPending, isPlaceholderData } = useTreemap();

  const { nodes, links } = useMemo(() => {
    const rows = data ?? [];
    const topAreas = aggregate(rows, (row) => row.area).slice(0, MAX_AREAS);
    const topInstr = aggregate(rows, (row) => row.instrumento).slice(0, MAX_INSTRUMENTS);
    const areaSet = new Set(topAreas.map((entry) => entry.name));
    const instrSet = new Set(topInstr.map((entry) => entry.name));

    // Collapse each (area, instrument) pair into a single weighted ribbon
    const ribbons = new Map<string, SankeyLink>();
    for (const row of rows) {
      if (!areaSet.has(row.area) || !instrSet.has(row.instrumento)) continue;
      const k = `${row.area} ${row.instrumento}`;
      const entry = ribbons.get(k) ?? {
        source: row.area,
        target: row.instrumento + ZWS,
        value: 0,
        proyectos: 0,
      };
      entry.value += row.aportacion;
      entry.proyectos += row.proyectos;
      ribbons.set(k, entry);
    }

    // A node's thickness must equal the sum of the ribbons actually drawn from
    // it, so derive each node's value/proyectos from those ribbons — not from
    // the grand totals, which also include flows to counterparts not shown.
    const drawnTotals = (pick: (link: SankeyLink) => string) => {
      const totals = new Map<string, { aportacion: number; proyectos: number }>();
      for (const link of ribbons.values()) {
        const key = pick(link);
        const entry = totals.get(key) ?? { aportacion: 0, proyectos: 0 };
        entry.aportacion += link.value;
        entry.proyectos += link.proyectos;
        totals.set(key, entry);
      }
      return totals;
    };
    const areaTotals = drawnTotals((link) => link.source);
    const instrTotals = drawnTotals((link) => link.target);

    const areaColor = rampFor(
      topAreas.map((a) => areaTotals.get(a.name)?.aportacion ?? 0),
      AREA_RAMP,
    );

    const sankeyNodes: SankeyNode[] = [
      ...topAreas.map((area) => {
        const total = areaTotals.get(area.name) ?? { aportacion: 0, proyectos: 0 };
        return {
          name: area.name,
          value: total.aportacion,
          proyectos: total.proyectos,
          depth: 0,
          itemStyle: { color: areaColor(total.aportacion), borderWidth: 0 },
        };
      }),
      ...topInstr.map((instr, index) => {
        const total = instrTotals.get(instr.name + ZWS) ?? { aportacion: 0, proyectos: 0 };
        return {
          name: instr.name + ZWS,
          value: total.aportacion,
          proyectos: total.proyectos,
          depth: 1,
          itemStyle: {
            color: TIMESERIES_PALETTE[index % TIMESERIES_PALETTE.length]!,
            borderWidth: 0,
          },
        };
      }),
    ].filter((node) => node.value > 0);

    return { nodes: sankeyNodes, links: [...ribbons.values()] };
  }, [data]);

  const option = useMemo(
    () => ({
      tooltip: {
        ...baseTooltip,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            const link = params.data as SankeyLink;
            return (
              ttTitle(`${clean(link.source)} → ${clean(link.target)}`) +
              ttRow('Aportación CDTI', formatMoney(link.value)) +
              ttRow('Proyectos', formatInt(link.proyectos))
            );
          }
          const node = params.data as SankeyNode;
          return (
            ttTitle(clean(node.name)) +
            ttRow('Aportación CDTI', formatMoney(node.value)) +
            ttRow('Proyectos', formatInt(node.proyectos))
          );
        },
      },
      series: [
        {
          type: 'sankey' as const,
          left: 150,
          right: 150,
          top: 14,
          bottom: 14,
          nodeWidth: 11,
          nodeGap: 14,
          nodeAlign: 'justify' as const,
          draggable: false,
          layoutIterations: 48,
          data: nodes,
          links,
          label: {
            fontFamily: MONO_FONT,
            fontSize: 11,
            color: LABEL_COLOR,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => truncate(clean(params.name), 22),
          },
          levels: [
            { depth: 0, label: { position: 'left' as const } },
            { depth: 1, label: { position: 'right' as const } },
          ],
          // Ribbons rest fairly lit so that hovering a node — whose connected
          // ribbons stay in the normal (non-emphasis) state — lights them just
          // as strongly as hovering a single ribbon. The blur state then fades
          // everything else away for the focus contrast.
          lineStyle: { color: 'gradient' as const, opacity: 0.82, curveness: 0.5 },
          emphasis: {
            // Hovering a single ribbon (or node) keeps its own flow path lit
            focus: 'trajectory' as const,
            lineStyle: { opacity: 0.92 },
            label: { color: '#18181b', fontWeight: 'bold' as const },
          },
          blur: {
            lineStyle: { opacity: 0.07 },
            itemStyle: { opacity: 0.22 },
            label: { opacity: 0.3 },
          },
          animationDuration: 800,
          animationEasingUpdate: 'quinticInOut' as const,
        },
      ],
    }),
    [nodes, links],
  );

  return (
    <Card
      title="Áreas sectoriales → instrumentos"
      subtitle="Flujo de aportación entre las principales áreas y sus instrumentos"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-[34rem]"
    >
      <EChart option={option} className="h-[34rem] w-full" />
    </Card>
  );
}
