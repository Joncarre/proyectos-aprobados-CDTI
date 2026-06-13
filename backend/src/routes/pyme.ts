import type { FastifyPluginAsync } from 'fastify';
import type { PymeGroup } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

interface RawGroup {
  pyme: boolean;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

/**
 * GET /api/pyme-comparison — headline metrics for PYME vs non-PYME, to answer
 * whether the aid reaches small firms or the money concentrates in large ones.
 */
export const pymeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/pyme-comparison', async (request): Promise<PymeGroup[]> => {
    const filters = parseFilters(request.query);
    const clause = andWhere(buildWhere(filters), 'pyme IS NOT NULL');

    const rows = await query<RawGroup>(
      `
      SELECT
        pyme,
        count(*)::INT AS proyectos,
        coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
        coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
        round(avg(porcentaje_aportacion), 1)::DOUBLE AS "pctMedio"
      FROM projects ${clause.where}
      GROUP BY pyme`,
      clause.params,
    );

    const find = (isPyme: boolean): PymeGroup => {
      const row = rows.find((r) => r.pyme === isPyme);
      return {
        grupo: isPyme ? 'pyme' : 'no',
        proyectos: row?.proyectos ?? 0,
        presupuesto: row?.presupuesto ?? 0,
        aportacion: row?.aportacion ?? 0,
        pctMedio: row?.pctMedio ?? null,
        ticketMedio: row && row.proyectos > 0 ? row.aportacion / row.proyectos : 0,
      };
    };

    return [find(true), find(false)];
  });
};
