import type { FastifyPluginAsync } from 'fastify';
import type { KpiTrendPoint } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

/**
 * GET /api/kpi-trends — each header KPI aggregated per year, for the sparklines
 * and deltas. The frontend calls this with the year/month filters stripped, so
 * the trend always spans the full range of the current segment.
 */
export const kpiTrendsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/kpi-trends', async (request): Promise<KpiTrendPoint[]> => {
    const filters = parseFilters(request.query);
    const clause = andWhere(buildWhere(filters), 'anio IS NOT NULL');

    return query<KpiTrendPoint>(
      `
      SELECT
        anio::INT AS anio,
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio",
        round(avg(CASE WHEN pyme THEN 100.0 WHEN NOT pyme THEN 0.0 END), 2)::DOUBLE AS "pctPymes"
      FROM projects ${clause.where}
      GROUP BY anio
      ORDER BY anio`,
      clause.params,
    );
  });
};
