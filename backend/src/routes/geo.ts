import type { FastifyPluginAsync } from 'fastify';
import { geoParamsSchema, type GeoRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { buildWhere } from '../where.js';

/** GET /api/geo — metrics per CCAA or per provincia for the choropleth map. */
export const geoRoutes: FastifyPluginAsync = async (app) => {
  app.get('/geo', async (request): Promise<GeoRow[]> => {
    const filters = parseFilters(request.query);
    const { nivel } = parseQuery(geoParamsSchema, request.query);
    const clause = buildWhere(filters);

    const groupColumns = nivel === 'ccaa' ? 'ccaa, NULL AS provincia' : 'ccaa, provincia';
    const groupBy = nivel === 'ccaa' ? 'ccaa' : 'ccaa, provincia';

    return query<GeoRow>(
      `
      SELECT
        ${groupColumns},
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio"
      FROM projects ${clause.where}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}`,
      clause.params,
    );
  });
};
