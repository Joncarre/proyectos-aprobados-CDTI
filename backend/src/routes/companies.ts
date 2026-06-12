import type { FastifyPluginAsync } from 'fastify';
import { companiesParamsSchema, type CompanyRow } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { buildWhere } from '../where.js';

/** GET /api/companies — recurring companies (by NIF) within the filtered set. */
export const companiesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/companies', async (request): Promise<CompanyRow[]> => {
    const filters = parseFilters(request.query);
    const { minProyectos, limit, ordenar } = parseQuery(companiesParamsSchema, request.query);
    const clause = buildWhere(filters);
    const orderBy = ordenar === 'proyectos' ? 'proyectos DESC, aportacion DESC' : 'aportacion DESC';

    return query<CompanyRow>(
      `
      SELECT
        nif,
        mode(razon_social) AS "razonSocial",
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio",
        min(anio)::INT AS "primerAnio",
        max(anio)::INT AS "ultimoAnio"
      FROM projects ${clause.where}
      GROUP BY nif
      HAVING count(*) >= ?
      ORDER BY ${orderBy}
      LIMIT ?`,
      [...clause.params, minProyectos, limit],
    );
  });
};
