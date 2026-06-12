import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  Aggregates,
  CompanyRow,
  DistributionBin,
  GeoRow,
  HeatmapCell,
  MetaResponse,
  ProjectsResponse,
  RankingRow,
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

export const useTimeseries = (granularidad: 'anio' | 'mes', agrupar?: string) =>
  useApiQuery<TimeseriesPoint[]>('/api/timeseries', { granularidad, agrupar });

export const useGeo = (nivel: 'ccaa' | 'provincia') => useApiQuery<GeoRow[]>('/api/geo', { nivel });

export const useHeatmap = (dim: 'area' | 'ccaa') =>
  useApiQuery<HeatmapCell[]>('/api/heatmap', { dim });

export const useRankings = (por: string, limit: number) =>
  useApiQuery<RankingRow[]>('/api/rankings', { por, limit });

export const useDistribution = (ancho: number) =>
  useApiQuery<DistributionBin[]>('/api/distribution', { ancho });

export const useCompanies = (minProyectos: number, limit: number) =>
  useApiQuery<CompanyRow[]>('/api/companies', { minProyectos, limit });

export const useTreemap = () => useApiQuery<TreemapRow[]>('/api/treemap');

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
