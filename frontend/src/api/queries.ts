import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  Aggregates,
  CohortRow,
  CompanyRow,
  DistributionResponse,
  GeoRow,
  HeatmapCell,
  KpiTrendPoint,
  KpiWindowResponse,
  MetaResponse,
  ProjectsResponse,
  PymeGroup,
  RankingRow,
  SeasonalityRow,
  TimeseriesPoint,
  TreemapRow,
} from '@cdti/shared';
import { filtersToSearchParams } from '../lib/searchParams';
import { useFiltersStore } from '../state/filters';
import { getJson } from './client';

type ExtraParams = Record<string, string | number | undefined>;

/** Global filters + endpoint-specific params, cached per serialized query string. */
function useApiQuery<T>(path: string, extra?: ExtraParams) {
  const filters = useFiltersStore((state) => state.filters);
  const params = filtersToSearchParams(filters);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined) params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return useQuery({
    queryKey: [path, queryString],
    queryFn: () => getJson<T>(path, params),
    placeholderData: keepPreviousData,
  });
}

/** Filter options, ranges and ingest info. Static until the API restarts. */
export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => getJson<MetaResponse>('/api/meta'),
    staleTime: Infinity,
  });
}

export const useStats = () => useApiQuery<Aggregates>('/api/stats');

/**
 * Per-year KPI series for the header sparklines. The year/month filters are
 * stripped so the trend always shows the full multi-year evolution of the
 * current segment (the big KPI number still reflects every active filter).
 */
export function useKpiTrends() {
  const filters = useFiltersStore((state) => state.filters);
  const params = filtersToSearchParams({ ...filters, anios: undefined, meses: undefined });
  return useQuery({
    queryKey: ['kpi-trends', params.toString()],
    queryFn: () => getJson<KpiTrendPoint[]>('/api/kpi-trends', params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Trailing-12-months vs. the prior 12 months (ending on the last-update date)
 * for the header deltas. Year/month filters are stripped — the window itself is
 * the time frame; the rest of the filters still apply.
 */
export function useKpiWindow() {
  const filters = useFiltersStore((state) => state.filters);
  const params = filtersToSearchParams({ ...filters, anios: undefined, meses: undefined });
  return useQuery({
    queryKey: ['kpi-window', params.toString()],
    queryFn: () => getJson<KpiWindowResponse>('/api/kpi-window', params),
    placeholderData: keepPreviousData,
  });
}

export const useTimeseries = (granularidad: 'anio' | 'mes', agrupar?: string) =>
  useApiQuery<TimeseriesPoint[]>('/api/timeseries', { granularidad, agrupar });

export const useGeo = (nivel: 'ccaa' | 'provincia') => useApiQuery<GeoRow[]>('/api/geo', { nivel });

export const useHeatmap = (dim: 'area' | 'ccaa') =>
  useApiQuery<HeatmapCell[]>('/api/heatmap', { dim });

export const useRankings = (por: string, limit: number) =>
  useApiQuery<RankingRow[]>('/api/rankings', { por, limit });

export const useDistribution = (desglose: 'ninguno' | 'tipoAyuda' | 'instrumento') =>
  useApiQuery<DistributionResponse>('/api/distribution', { desglose });

export const useCompanies = (minProyectos: number, limit: number) =>
  useApiQuery<CompanyRow[]>('/api/companies', { minProyectos, limit });

export const useTreemap = () => useApiQuery<TreemapRow[]>('/api/treemap');

export const useCohorts = () => useApiQuery<CohortRow[]>('/api/cohorts');

export const useSeasonality = () => useApiQuery<SeasonalityRow[]>('/api/seasonality');

export const usePymeComparison = () => useApiQuery<PymeGroup[]>('/api/pyme-comparison');

export const useProjects = (page: number, pageSize: number, sort: string, order: 'asc' | 'desc') =>
  useApiQuery<ProjectsResponse>('/api/projects', { page, pageSize, sort, order });

/** URL for the CSV export of the current filtered set (used as a plain link). */
export function useExportUrl(): string {
  const filters = useFiltersStore((state) => state.filters);
  const params = filtersToSearchParams(filters);
  const queryString = params.toString();
  const base: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  return `${base}/api/projects/export${queryString ? `?${queryString}` : ''}`;
}
