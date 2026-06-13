import type { FastifyPluginAsync } from 'fastify';
import type { SeasonalityRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

/**
 * GET /api/seasonality — approvals per calendar month (1-12), aggregated across
 * all years in the filtered set. Reveals quarter-end / December clustering.
 */
export const seasonalityRoutes: FastifyPluginAsync = async (app) => {
  app.get('/seasonality', async (request): Promise<SeasonalityRow[]> => {
    const filters = parseFilters(request.query);
    const clause = andWhere(buildWhere(filters), 'mes IS NOT NULL');

    const rows = await query<SeasonalityRow>(
      `
      SELECT
        mes::INT AS mes,
        count(*)::INT AS proyectos,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion
      FROM projects ${clause.where}
      GROUP BY mes
      ORDER BY mes`,
      clause.params,
    );

    // Always return all 12 months so the chart axis is stable
    const byMonth = new Map(rows.map((row) => [row.mes, row]));
    return Array.from({ length: 12 }, (_, index) => {
      const mes = index + 1;
      return byMonth.get(mes) ?? { mes, proyectos: 0, aportacion: 0 };
    });
  });
};
