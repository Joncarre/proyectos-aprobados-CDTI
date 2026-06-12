import type { FastifyPluginAsync } from 'fastify';
import { timeseriesParamsSchema, type TimeseriesPoint } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

const GROUP_COLUMNS = {
  ccaa: 'ccaa',
  area: 'area_sectorial',
  instrumento: 'instrumento',
  origen: 'origen_fondos',
} as const;

/**
 * GET /api/timeseries — presupuesto/aportación/nº/% medio per period,
 * optionally split by ccaa | area | instrumento | origen to compare evolutions.
 */
export const timeseriesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/timeseries', async (request): Promise<TimeseriesPoint[]> => {
    const filters = parseFilters(request.query);
    const { granularidad, agrupar } = parseQuery(timeseriesParamsSchema, request.query);

    const periodo =
      granularidad === 'anio' ? 'anio::VARCHAR' : `strftime(fecha_aprobacion, '%Y-%m')`;
    const grupo = agrupar ? GROUP_COLUMNS[agrupar] : 'NULL';
    let clause = buildWhere(filters);
    if (agrupar) clause = andWhere(clause, `${GROUP_COLUMNS[agrupar]} IS NOT NULL`);

    return query<TimeseriesPoint>(
      `
      SELECT
        ${periodo} AS periodo,
        ${grupo} AS grupo,
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio"
      FROM projects ${clause.where}
      GROUP BY periodo, grupo
      ORDER BY periodo, grupo`,
      clause.params,
    );
  });
};
