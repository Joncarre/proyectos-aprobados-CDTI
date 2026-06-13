import type { FastifyPluginAsync } from 'fastify';
import {
  distributionParamsSchema,
  type DistributionResponse,
  type DistributionSeries,
} from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { andWhere, buildWhere } from '../where.js';

const BIN_WIDTH = 5;
const BIN_COUNT = 100 / BIN_WIDTH; // 20
const MAX_SERIES = 6; // cap for instrumento decomposition

const GROUP_COLUMNS = {
  tipoAyuda: 'tipo_ayuda',
  instrumento: 'instrumento',
} as const;

interface RawRow {
  categoria: string;
  binIdx: number;
  n: number;
}

/**
 * GET /api/distribution — histogram of porcentaje_aportacion in 5-point bins.
 * `desglose=tipoAyuda|instrumento` returns one series per category so the
 * bimodal shape can be explained (grants vs reimbursable loans, etc.).
 */
export const distributionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/distribution', async (request): Promise<DistributionResponse> => {
    const filters = parseFilters(request.query);
    const { desglose } = parseQuery(distributionParamsSchema, request.query);
    let clause = andWhere(buildWhere(filters), 'porcentaje_aportacion IS NOT NULL');

    const categoryExpr = desglose === 'ninguno' ? `'Total'` : GROUP_COLUMNS[desglose];
    if (desglose !== 'ninguno') {
      clause = andWhere(clause, `${GROUP_COLUMNS[desglose]} IS NOT NULL`);
    }

    const rows = await query<RawRow>(
      `
      SELECT
        ${categoryExpr} AS categoria,
        least(floor(porcentaje_aportacion / ${BIN_WIDTH}), ${BIN_COUNT - 1})::INT AS "binIdx",
        count(*)::INT AS n
      FROM projects ${clause.where}
      GROUP BY categoria, "binIdx"`,
      clause.params,
    );

    // Pivot rows into per-category bin arrays + running mean numerator
    const byCategory = new Map<string, { bins: number[]; total: number; pctSum: number }>();
    for (const row of rows) {
      const entry = byCategory.get(row.categoria) ?? {
        bins: new Array<number>(BIN_COUNT).fill(0),
        total: 0,
        pctSum: 0,
      };
      entry.bins[row.binIdx] = (entry.bins[row.binIdx] ?? 0) + row.n;
      entry.total += row.n;
      // bin center as a mean proxy keeps this aggregate-only (no second query)
      entry.pctSum += (row.binIdx * BIN_WIDTH + BIN_WIDTH / 2) * row.n;
      byCategory.set(row.categoria, entry);
    }

    const series: DistributionSeries[] = [...byCategory.entries()]
      .map(([categoria, e]) => ({
        categoria,
        total: e.total,
        pctMedio: e.total > 0 ? Math.round(e.pctSum / e.total) : null,
        bins: e.bins,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, desglose === 'instrumento' ? MAX_SERIES : undefined);

    return { binWidth: BIN_WIDTH, series };
  });
};
