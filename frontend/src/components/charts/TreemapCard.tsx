import { useMemo } from 'react';
import { useTreemap } from '../../api/queries';
import { baseTooltip, MONO_FONT, SERIES_PALETTE, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt, formatMoney, formatMoneyCompact } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

interface TreemapNode {
  name: string;
  value: number;
  proyectos: number;
  children?: TreemapNode[];
}

export function TreemapCard() {
  const { data, isPending, isPlaceholderData } = useTreemap();

  const option = useMemo(() => {
    const rows = data ?? [];
    const byArea = new Map<string, TreemapNode>();
    for (const row of rows) {
      const area = byArea.get(row.area) ?? {
        name: row.area,
        value: 0,
        proyectos: 0,
        children: [],
      };
      area.value += row.aportacion;
      area.proyectos += row.proyectos;
      area.children!.push({
        name: row.instrumento,
        value: row.aportacion,
        proyectos: row.proyectos,
      });
      byArea.set(row.area, area);
    }
    const tree = [...byArea.values()].sort((a, b) => b.value - a.value);

    return {
      tooltip: {
        ...baseTooltip,
        formatter: (params: { name: string; value: unknown; data?: { proyectos?: number } }) => {
          const proyectos = params.data?.proyectos;
          return (
            ttTitle(params.name) +
            ttRow('Aportación CDTI', formatMoney(Number(params.value))) +
            (proyectos !== undefined ? ttRow('Proyectos', formatInt(proyectos)) : '')
          );
        },
      },
      series: [
        {
          type: 'treemap' as const,
          data: tree,
          leafDepth: 1,
          roam: false,
          width: '100%',
          height: '88%',
          top: 0,
          breadcrumb: {
            show: true,
            bottom: 0,
            itemStyle: { color: '#f4f4f5', textStyle: { color: '#55555e', fontSize: 11 } },
            emphasis: { itemStyle: { color: '#eef2ff' } },
          },
          label: {
            show: true,
            fontSize: 11,
            fontFamily: MONO_FONT,
            formatter: (params: { name: string; value: unknown }) =>
              `${params.name}\n{num|${formatMoneyCompact(Number(params.value))}}`,
            rich: { num: { fontFamily: MONO_FONT, fontSize: 10, color: 'inherit' } },
          },
          itemStyle: { borderColor: '#ffffff', borderWidth: 2, gapWidth: 2, borderRadius: 4 },
          colorSaturation: [0.45, 0.7] as [number, number],
          levels: [
            { color: SERIES_PALETTE, colorMappingBy: 'index' as const },
            { colorSaturation: [0.35, 0.6] as [number, number] },
          ],
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Áreas sectoriales → instrumentos"
      subtitle="El tamaño del nodo indica la aportación CDTI"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <EChart option={option} className="h-96 w-full" />
    </Card>
  );
}
