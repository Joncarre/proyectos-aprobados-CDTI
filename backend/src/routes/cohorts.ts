import type { FastifyPluginAsync } from 'fastify';
import type { CohortRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { buildWhere } from '../where.js';

/**
 * GET /api/cohorts — per approval year, how many companies received CDTI aid
 * for the first time ever (nuevas) vs already had a prior project (recurrentes).
 *
 * "First time ever" is global per NIF (companies.primer_anio over the whole
 * dataset), while the year counts respect the active filters: a company is
 * "new" in the year of its first CDTI project anywhere.
 */
export const cohortsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/cohorts', async (request): Promise<CohortRow[]> => {
    const filters = parseFilters(request.query);
    const clause = buildWhere(filters);

    return query<CohortRow>(
      `
      WITH filtered AS (
        SELECT DISTINCT anio, nif FROM projects ${clause.where}
      )
      SELECT
        f.anio::INT AS anio,
        count(*) FILTER (WHERE c.primer_anio = f.anio)::INT AS nuevas,
        count(*) FILTER (WHERE c.primer_anio < f.anio)::INT AS recurrentes
      FROM filtered f
      JOIN companies c USING (nif)
      WHERE f.anio IS NOT NULL
      GROUP BY f.anio
      ORDER BY f.anio`,
      clause.params,
    );
  });
};
