import type { FastifyPluginAsync } from 'fastify';
import { rankingParamsSchema, type RankingRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

const RANKING_COLUMNS = {
  instrumento: 'instrumento',
  area: 'area_sectorial',
  origen: 'origen_fondos',
  tipoAyuda: 'tipo_ayuda',
  ccaa: 'ccaa',
} as const;

/** GET /api/rankings — top categories by aportación for bar charts. */
export const rankingsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/rankings', async (request): Promise<RankingRow[]> => {
    const filters = parseFilters(request.query);
    const { por, limit } = parseQuery(rankingParamsSchema, request.query);
    const column = RANKING_COLUMNS[por];
    const clause = andWhere(buildWhere(filters), `${column} IS NOT NULL`);

    return query<RankingRow>(
      `
      SELECT
        ${column} AS categoria,
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio"
      FROM projects ${clause.where}
      GROUP BY categoria
      ORDER BY aportacion DESC
      LIMIT ?`,
      [...clause.params, limit],
    );
  });
};
