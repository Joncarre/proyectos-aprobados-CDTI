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
  /**
   * Merge the series instead of replacing it, so ECharts can tween values and
   * colours between updates (used by the choropleth). Default replaces the
   * series, which is needed by charts whose series count varies.
   */
  mergeSeries?: boolean;
}

/**
 * Thin React wrapper: init once, resize with the container, dispose on unmount.
 */
export function EChart({ option, className, onClick, mergeSeries = false }: EChartProps) {
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
    chartRef.current?.setOption(option, mergeSeries ? {} : { replaceMerge: ['series'] });
  }, [option, mergeSeries]);

  return <div ref={containerRef} className={className} />;
}
