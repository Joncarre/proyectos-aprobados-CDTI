import type { Aggregates } from '@cdti/shared';
import { query } from './db.js';
import type { WhereClause } from './where.js';

/** KPI aggregates over the filtered set; shared by /api/stats and /api/projects. */
export async function fetchAggregates(clause: WhereClause): Promise<Aggregates> {
  const [row] = await query<Aggregates>(
    `
    SELECT
      count(*)::INT AS proyectos,
      count(DISTINCT nif)::INT AS empresas,
      coalesce(sum(presupuesto), 0)::DOUBLE AS "presupuestoTotal",
      coalesce(sum(aportacion_cdti), 0)::DOUBLE AS "aportacionTotal",
      round(avg(porcentaje_aportacion), 2)::DOUBLE AS "pctMedio",
      round(avg(CASE WHEN pyme THEN 100.0 WHEN NOT pyme THEN 0.0 END), 2)::DOUBLE AS "pctPymes"
    FROM projects ${clause.where}`,
    clause.params,
  );
  return row!;
}
