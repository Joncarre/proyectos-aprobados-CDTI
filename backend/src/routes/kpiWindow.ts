import type { FastifyPluginAsync } from 'fastify';
import type { KpiWindowMetrics, KpiWindowResponse } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { buildWhere, type WhereClause } from '../where.js';
import { whitelists } from '../whitelists.js';

const METRICS = `
  count(*)::INT AS proyectos,
  coalesce(sum(presupuesto), 0)::DOUBLE AS presupuesto,
  coalesce(sum(aportacion_cdti), 0)::DOUBLE AS aportacion,
  round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio",
  round(avg(CASE WHEN pyme THEN 100.0 WHEN NOT pyme THEN 0.0 END), 2)::DOUBLE AS "pctPymes"`;

/** Metrics for projects approved within (start, end], honouring the filters. */
async function windowMetrics(
  clause: WhereClause,
  start: string,
  end: string,
): Promise<KpiWindowMetrics> {
  const range = 'fecha_aprobacion > CAST(? AS DATE) AND fecha_aprobacion <= CAST(? AS DATE)';
  const where = clause.where === '' ? `WHERE ${range}` : `${clause.where} AND ${range}`;
  const [row] = await query<KpiWindowMetrics>(`SELECT ${METRICS} FROM projects ${where}`, [
    ...clause.params,
    start,
    end,
  ]);
  return row!;
}

/** Shifts a YYYY-MM-DD string back by `n` whole years (date/month preserved). */
const minusYears = (ymd: string, n: number): string =>
  `${Number(ymd.slice(0, 4)) - n}${ymd.slice(4)}`;

/**
 * GET /api/kpi-window — trailing-12-months comparison for the header deltas.
 * `current` is the year ending on the last-update date; `previous` the year
 * before. Filter-aware (the frontend strips the year/month filters).
 */
export const kpiWindowRoutes: FastifyPluginAsync = async (app) => {
  app.get('/kpi-window', async (request): Promise<KpiWindowResponse> => {
    const filters = parseFilters(request.query);
    const clause = buildWhere(filters);

    const refDate = whitelists.ingest.ingestedAt.slice(0, 10); // YYYY-MM-DD
    const curStart = minusYears(refDate, 1);
    const prevStart = minusYears(refDate, 2);

    const current = await windowMetrics(clause, curStart, refDate);
    const previous = await windowMetrics(clause, prevStart, curStart);

    return { refDate, current, previous };
  });
};
