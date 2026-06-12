import type { FastifyPluginAsync } from 'fastify';
import type { TreemapRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

/** GET /api/treemap — área sectorial → instrumento breakdown for the treemap. */
export const treemapRoutes: FastifyPluginAsync = async (app) => {
  app.get('/treemap', async (request): Promise<TreemapRow[]> => {
    const filters = parseFilters(request.query);
    const clause = andWhere(
      buildWhere(filters),
      'area_sectorial IS NOT NULL AND instrumento IS NOT NULL',
    );

    return query<TreemapRow>(
      `
      SELECT
        area_sectorial AS area,
        instrumento,
        count(*)::INT AS proyectos,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion
      FROM projects ${clause.where}
      GROUP BY area, instrumento
      ORDER BY aportacion DESC`,
      clause.params,
    );
  });
};
