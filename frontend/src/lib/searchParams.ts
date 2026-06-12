import { FILTER_PARAM_KEYS, projectFiltersSchema, type ProjectFilters } from '@cdti/shared';

/** Serialises filters as repeated query params — same wire format for the API and the URL bar. */
export function filtersToSearchParams(filters: ProjectFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_PARAM_KEYS) {
    const value = filters[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

/** Parses (and validates) filters from a query string; invalid input falls back to no filters. */
export function parseFilters(search: string): ProjectFilters {
  const params = new URLSearchParams(search);
  const raw: Record<string, string | string[]> = {};
  for (const key of FILTER_PARAM_KEYS) {
    const values = params.getAll(key);
    if (values.length === 1) raw[key] = values[0]!;
    else if (values.length > 1) raw[key] = values;
  }
  const result = projectFiltersSchema.safeParse(raw);
  return result.success ? result.data : {};
}
