// Tree-shaken ECharts setup: only the charts/components we actually use.
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, HeatmapChart, LineChart, MapChart, TreemapChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  HeatmapChart,
  MapChart,
  TreemapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
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

/** Sequential ramp for choropleth/heatmap intensity (accent family). */
export const SEQUENTIAL_RAMP = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'];

export const CHART_FONT = {
  fontFamily: "'Inter Variable', system-ui, sans-serif",
};

/** Base tooltip style shared by all charts. */
export const baseTooltip = {
  backgroundColor: '#ffffff',
  borderColor: '#e8e8ea',
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: '#1a1a1e', fontSize: 12, ...CHART_FONT },
  extraCssText: 'box-shadow: 0 4px 12px rgb(26 26 30 / 0.08); border-radius: 8px;',
};

export const AXIS_LABEL = { color: '#55555e', fontSize: 11, ...CHART_FONT };
export const AXIS_LINE = { lineStyle: { color: '#e8e8ea' } };
export const SPLIT_LINE = { lineStyle: { color: '#f0f0f1' } };
