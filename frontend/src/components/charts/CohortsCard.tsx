import { useMemo } from 'react';
import { useCohorts } from '../../api/queries';
import { AXIS_LABEL, baseTooltip, MONO_FONT, ttRow, ttTitle } from '../../lib/echarts';
import { formatInt } from '../../lib/format';
import { Card } from '../ui/Card';
import { EChart } from './EChart';

const COLOR_NEW = '#4f46e5'; // intake, inner ring
const COLOR_RETURN = '#0d9488'; // returning base, outer ring

/**
 * Radial "bloom": every year is a spoke growing from the centre, split into new
 * beneficiaries (inner) and returning ones (outer). Spoke length reads the total
 * and the inner/outer share reads the renewal mix.
 */
export function CohortsCard() {
  const { data, isPending, isPlaceholderData } = useCohorts();

  const option = useMemo(() => {
    const rows = data ?? [];
    const years = rows.map((row) => String(row.anio));

    return {
      tooltip: {
        ...baseTooltip,
        trigger: 'axis' as const,
        formatter: (items: Array<{ dataIndex: number }>) => {
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return '';
          const total = row.nuevas + row.recurrentes;
          const pct = total > 0 ? Math.round((row.nuevas / total) * 100) : 0;
          return (
            ttTitle(String(row.anio)) +
            ttRow('Nuevas', formatInt(row.nuevas), COLOR_NEW) +
            ttRow('Recurrentes', formatInt(row.recurrentes), COLOR_RETURN) +
            ttRow('Total', formatInt(total)) +
            ttRow('Renovación', `${pct} %`)
          );
        },
      },
      legend: {
        bottom: 0,
        textStyle: { ...AXIS_LABEL, fontSize: 10 },
        icon: 'roundRect',
        itemWidth: 9,
        itemHeight: 9,
        data: ['Nuevas', 'Recurrentes'],
      },
      polar: { center: ['50%', '46%'], radius: ['20%', '80%'] },
      angleAxis: {
        type: 'category' as const,
        data: years,
        startAngle: 90,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#71717a', fontSize: 9, fontFamily: MONO_FONT },
        z: 10,
      },
      radiusAxis: {
        type: 'value' as const,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f1' } },
      },
      series: [
        {
          name: 'Nuevas',
          type: 'bar' as const,
          coordinateSystem: 'polar' as const,
          stack: 'cohortes',
          data: rows.map((row) => row.nuevas),
          itemStyle: { color: COLOR_NEW },
          emphasis: { focus: 'series' as const },
        },
        {
          name: 'Recurrentes',
          type: 'bar' as const,
          coordinateSystem: 'polar' as const,
          stack: 'cohortes',
          data: rows.map((row) => row.recurrentes),
          itemStyle: { color: COLOR_RETURN },
          roundCap: true,
          emphasis: { focus: 'series' as const },
        },
      ],
      barCategoryGap: '38%',
    };
  }, [data]);

  return (
    <Card
      title="Nuevos beneficiarios vs. recurrentes"
      subtitle="Empresas con su primera ayuda frente a las que repiten"
      isPending={isPending}
      isUpdating={isPlaceholderData}
      bodyHeight="h-96"
    >
      <EChart option={option} className="h-96 w-full" />
    </Card>
  );
}
