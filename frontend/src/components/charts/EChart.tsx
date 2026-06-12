import { useEffect, useRef } from 'react';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { echarts } from '../../lib/echarts';

export interface EChartClickParams {
  name: string;
  seriesName?: string;
  value?: unknown;
}

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
  onClick?: (params: EChartClickParams) => void;
}

/**
 * Thin React wrapper: init once, resize with the container, dispose on unmount.
 * Options are applied with replaceMerge so data updates animate smoothly and
 * removed series don't linger.
 */
export function EChart({ option, className, onClick }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useEffect(() => {
    const chart = echarts.init(containerRef.current!);
    chartRef.current = chart;
    chart.on('click', (params) => clickRef.current?.(params as unknown as EChartClickParams));

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current!);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { replaceMerge: ['series'] });
  }, [option]);

  return <div ref={containerRef} className={className} />;
}
