import { useEffect, useRef } from 'react';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { echarts } from '../../lib/echarts';

export interface EChartClickParams {
  name: string;
  seriesName?: string;
  value?: unknown;
}

export interface EChartHoverParams {
  dataType?: 'node' | 'edge';
  name: string;
  dataIndex: number;
}

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
  onClick?: (params: EChartClickParams) => void;
  /** Fires on item hover; receives the chart so callers can dispatch actions. */
  onMouseOver?: (params: EChartHoverParams, chart: ECharts) => void;
  onMouseOut?: (params: EChartHoverParams, chart: ECharts) => void;
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
export function EChart({
  option,
  className,
  onClick,
  onMouseOver,
  onMouseOut,
  mergeSeries = false,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const overRef = useRef(onMouseOver);
  overRef.current = onMouseOver;
  const outRef = useRef(onMouseOut);
  outRef.current = onMouseOut;

  useEffect(() => {
    const chart = echarts.init(containerRef.current!);
    chartRef.current = chart;
    chart.on('click', (params) => clickRef.current?.(params as unknown as EChartClickParams));
    chart.on('mouseover', (params) =>
      overRef.current?.(params as unknown as EChartHoverParams, chart),
    );
    chart.on('mouseout', (params) =>
      outRef.current?.(params as unknown as EChartHoverParams, chart),
    );

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
