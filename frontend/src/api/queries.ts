import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Aggregates, MetaResponse } from '@cdti/shared';
import { filtersToSearchParams } from '../lib/searchParams';
import { useFiltersStore } from '../state/filters';
import { getJson } from './client';

/** Filter options, ranges and ingest info. Static until the API restarts. */
export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: () => getJson<MetaResponse>('/api/meta'),
    staleTime: Infinity,
  });
}

/** Live KPI aggregates for the current filters. Keeps previous data while refetching. */
export function useStats() {
  const filters = useFiltersStore((state) => state.filters);
  const params = filtersToSearchParams(filters);
  return useQuery({
    queryKey: ['stats', params.toString()],
    queryFn: () => getJson<Aggregates>('/api/stats', params),
    placeholderData: keepPreviousData,
  });
}
