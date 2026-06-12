import type { FastifyPluginAsync } from 'fastify';
import { distributionParamsSchema, type DistributionBin } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

/** GET /api/distribution — histogram of porcentaje_aportacion (bins of `ancho` points). */
export const distributionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/distribution', async (request): Promise<DistributionBin[]> => {
    const filters = parseFilters(request.query);
    const { ancho } = parseQuery(distributionParamsSchema, request.query);
    const clause = andWhere(buildWhere(filters), 'porcentaje_aportacion IS NOT NULL');

    // pct = 100 falls into the last bin instead of opening a new one
    const rows = await query<{ desde: number; proyectos: number }>(
      `
      SELECT least(floor(porcentaje_aportacion / ?) * ?, ?)::INT AS desde, count(*)::INT AS proyectos
      FROM projects ${clause.where}
      GROUP BY desde
      ORDER BY desde`,
      [ancho, ancho, 100 - ancho, ...clause.params],
    );

    const byStart = new Map(rows.map((row) => [row.desde, row.proyectos]));
    const bins: DistributionBin[] = [];
    for (let desde = 0; desde <= 100 - ancho; desde += ancho) {
      bins.push({ desde, hasta: desde + ancho, proyectos: byStart.get(desde) ?? 0 });
    }
    return bins;
  });
};
