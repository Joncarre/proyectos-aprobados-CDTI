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

/** Restrained categorical palette for multi-series overlays (accent first, dark-tuned). */
export const SERIES_PALETTE = [
  '#818cf8',
  '#2dd4bf',
  '#fbbf24',
  '#f472b6',
  '#38bdf8',
  '#a78bfa',
  '#a3e635',
  '#fb7185',
];

/** Teal-first palette for the time series card (user preference: turquoise/blue-green). */
export const TIMESERIES_PALETTE = [
  '#2dd4bf',
  '#22d3ee',
  '#60a5fa',
  '#818cf8',
  '#fbbf24',
  '#fb7185',
  '#a3e635',
  '#c084fc',
];

/** Sequential ramp for choropleth/heatmap intensity (dark → bright indigo). */
export const SEQUENTIAL_RAMP = ['#191c30', '#2a2e72', '#4a4fc0', '#7479f2', '#aab4fc'];

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
  `<div style="margin-bottom:6px;font-size:10.5px;font-weight:600;color:#f4f5f7">${text}</div>`;

export const ttRow = (label: string, value: string, dotColor?: string): string => {
  const dot = dotColor
    ? `<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${dotColor};margin-right:6px;vertical-align:middle"></span>`
    : '';
  return (
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;font-size:10px;line-height:1.65;color:#9698a2">` +
    `<span>${dot}${label}</span><span style="color:#e7e8ec">${value}</span></div>`
  );
};

/** Base tooltip style shared by all charts. */
export const baseTooltip = {
  backgroundColor: 'rgba(24, 25, 31, 0.92)',
  borderColor: '#33353f',
  borderWidth: 1,
  padding: [10, 12] as [number, number],
  textStyle: { color: '#e7e8ec', fontSize: 10, ...CHART_FONT },
  extraCssText:
    'border-radius:12px; backdrop-filter: blur(8px); box-shadow: 0 4px 12px rgb(0 0 0 / 0.45), 0 16px 40px rgb(0 0 0 / 0.5);',
};

export const AXIS_LABEL = { color: '#8a8c96', fontSize: 10, fontFamily: MONO_FONT };
export const AXIS_LINE = { lineStyle: { color: '#2e3039' } };
export const SPLIT_LINE = { lineStyle: { color: '#20222a' } };
