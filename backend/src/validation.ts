import type { z } from 'zod';
import { projectFiltersSchema, type ProjectFilters } from '@cdti/shared';
import { whitelists } from './whitelists.js';

export class ApiValidationError extends Error {
  readonly details: Array<{ param: string; message: string }>;

  constructor(details: Array<{ param: string; message: string }>) {
    super('Parámetros de consulta inválidos');
    this.details = details;
  }
}

/** Parses request.query with a zod schema; throws ApiValidationError on failure. */
export function parseQuery<S extends z.ZodType>(schema: S, query: unknown): z.infer<S> {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ApiValidationError(
      result.error.issues.map((issue) => ({
        param: issue.path.join('.') || '(query)',
        message: issue.message,
      })),
    );
  }
  return result.data;
}

/**
 * Parses the global filters and rejects categorical values that are not present
 * in the database (whitelists loaded at boot from the dim_* views).
 */
export function parseFilters(query: unknown): ProjectFilters {
  const filters = parseQuery(projectFiltersSchema, query);

  const checks: Array<{ param: string; values: string[] | undefined; allowed: Set<string> }> = [
    { param: 'ccaa', values: filters.ccaa, allowed: whitelists.ccaa },
    { param: 'provincias', values: filters.provincias, allowed: whitelists.provincias },
    { param: 'instrumentos', values: filters.instrumentos, allowed: whitelists.instrumentos },
    { param: 'areas', values: filters.areas, allowed: whitelists.areas },
    { param: 'origenes', values: filters.origenes, allowed: whitelists.origenes },
    { param: 'tiposAyuda', values: filters.tiposAyuda, allowed: whitelists.tiposAyuda },
  ];

  const details = checks.flatMap(({ param, values, allowed }) =>
    (values ?? [])
      .filter((value) => !allowed.has(value))
      .map((value) => ({ param, message: `Valor desconocido: «${value}»` })),
  );

  if (details.length > 0) throw new ApiValidationError(details);
  return filters;
}
