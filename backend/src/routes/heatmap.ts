import type { FastifyPluginAsync } from 'fastify';
import { heatmapParamsSchema, type HeatmapCell } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

const DIM_COLUMNS = { area: 'area_sectorial', ccaa: 'ccaa' } as const;

/** GET /api/heatmap — anio × (area sectorial | ccaa) matrix with all metrics per cell. */
export const heatmapRoutes: FastifyPluginAsync = async (app) => {
  app.get('/heatmap', async (request): Promise<HeatmapCell[]> => {
    const filters = parseFilters(request.query);
    const { dim } = parseQuery(heatmapParamsSchema, request.query);
    const column = DIM_COLUMNS[dim];
    const clause = andWhere(buildWhere(filters), `${column} IS NOT NULL`);

    return query<HeatmapCell>(
      `
      SELECT
        anio::INT AS anio,
        ${column} AS categoria,
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio"
      FROM projects ${clause.where}
      GROUP BY anio, categoria
      ORDER BY anio, categoria`,
      clause.params,
    );
  });
};
