// Tree-shaken ECharts setup: only the charts/components we actually use.
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, HeatmapChart, LineChart, MapChart, SankeyChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  HeatmapChart,
  MapChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

export { echarts };

/** Restrained categorical palette for multi-series overlays (accent first). */
export const SERIES_PALETTE = [
  '#4f46e5',
  '#0d9488',
  '#d97706',
  '#db2777',
  '#0284c7',
  '#7c3aed',
  '#65a30d',
  '#dc2626',
];

/** Teal-first palette for the time series card (user preference: turquoise/blue-green). */
export const TIMESERIES_PALETTE = [
  '#0d9488',
  '#2dd4bf',
  '#0ea5e9',
  '#6366f1',
  '#d97706',
  '#db2777',
  '#65a30d',
  '#7c3aed',
];

/** Sequential ramp for choropleth/heatmap intensity (accent family). */
export const SEQUENTIAL_RAMP = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'];

export const MONO_FONT = "'JetBrains Mono Variable', ui-monospace, monospace";

// All chart text (titles, tooltips, treemap labels) renders in the mono font too
export const CHART_FONT = {
  fontFamily: MONO_FONT,
};

/**
 * Premium tooltip building blocks. Only the title is bold; value rows are a
 * dim label on the left and the figure on the right, in a tight column.
 */
export const ttTitle = (text: string): string =>
  `<div style="margin-bottom:6px;font-size:10.5px;font-weight:600;color:#18181b">${text}</div>`;

export const ttRow = (label: string, value: string, dotColor?: string): string => {
  const dot = dotColor
    ? `<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${dotColor};margin-right:6px;vertical-align:middle"></span>`
    : '';
  return (
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;font-size:10px;line-height:1.65;color:#71717a">` +
    `<span>${dot}${label}</span><span style="color:#27272a">${value}</span></div>`
  );
};

/** Base tooltip style shared by all charts. */
export const baseTooltip = {
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  borderColor: '#ececee',
  borderWidth: 1,
  padding: [10, 12] as [number, number],
  textStyle: { color: '#27272a', fontSize: 10, ...CHART_FONT },
  extraCssText:
    'border-radius:12px; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgb(26 26 30 / 0.05), 0 12px 32px rgb(26 26 30 / 0.13);',
};

export const AXIS_LABEL = { color: '#55555e', fontSize: 10, fontFamily: MONO_FONT };
export const AXIS_LINE = { lineStyle: { color: '#e8e8ea' } };
export const SPLIT_LINE = { lineStyle: { color: '#f0f0f1' } };
