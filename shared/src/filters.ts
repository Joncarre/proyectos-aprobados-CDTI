import { z } from 'zod';

/** Fastify's query parser yields string | string[] for repeated params; normalise to array. */
const toArray = (value: unknown): unknown =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

const multi = <T extends z.ZodType>(item: T, maxItems: number) =>
  z.preprocess(toArray, z.array(item).min(1).max(maxItems)).optional();

const text = (maxLength: number) => z.string().trim().min(1).max(maxLength);

/**
 * Global filters accepted by every API endpoint, expressed as URL query params.
 * Multi-value filters use repeated params: ?ccaa=Cataluña&ccaa=La Rioja
 * Categorical values are additionally validated against database whitelists in the backend.
 */
export const projectFiltersSchema = z
  .object({
    anios: multi(z.coerce.number().int().min(2000).max(2100), 60),
    meses: multi(z.coerce.number().int().min(1).max(12), 12),
    presupuestoMin: z.coerce.number().min(0).optional(),
    presupuestoMax: z.coerce.number().min(0).optional(),
    aportacionMin: z.coerce.number().min(0).optional(),
    aportacionMax: z.coerce.number().min(0).optional(),
    pctMin: z.coerce.number().min(0).max(100).optional(),
    pctMax: z.coerce.number().min(0).max(100).optional(),
    ccaa: multi(text(80), 20),
    provincias: multi(text(80), 60),
    instrumentos: multi(text(120), 50),
    areas: multi(text(160), 80),
    origenes: multi(text(120), 30),
    tiposAyuda: multi(text(80), 10),
    pyme: z.enum(['si', 'no']).optional(),
    q: z.string().trim().min(2).max(120).optional(),
    nif: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{8,12}$/)
      .optional(),
  })
  .superRefine((f, ctx) => {
    const pairs = [
      ['presupuestoMin', 'presupuestoMax'],
      ['aportacionMin', 'aportacionMax'],
      ['pctMin', 'pctMax'],
    ] as const;
    for (const [minKey, maxKey] of pairs) {
      const min = f[minKey];
      const max = f[maxKey];
      if (min !== undefined && max !== undefined && min > max) {
        ctx.addIssue({ code: 'custom', path: [minKey], message: `${minKey} > ${maxKey}` });
      }
    }
  });

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

/** Keys of all global filter params — used by the frontend for URL synchronisation. */
export const FILTER_PARAM_KEYS = [
  'anios',
  'meses',
  'presupuestoMin',
  'presupuestoMax',
  'aportacionMin',
  'aportacionMax',
  'pctMin',
  'pctMax',
  'ccaa',
  'provincias',
  'instrumentos',
  'areas',
  'origenes',
  'tiposAyuda',
  'pyme',
  'q',
  'nif',
] as const satisfies ReadonlyArray<keyof ProjectFilters>;

// ── Endpoint-specific params (all also accept the global filters) ──

export const SORT_FIELDS = [
  'fecha',
  'presupuesto',
  'aportacion',
  'pct',
  'empresa',
  'anio',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(SORT_FIELDS).default('fecha'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const timeseriesParamsSchema = z.object({
  granularidad: z.enum(['anio', 'mes']).default('anio'),
  agrupar: z.enum(['ccaa', 'area', 'instrumento', 'origen']).optional(),
});
export type TimeseriesParams = z.infer<typeof timeseriesParamsSchema>;

export const geoParamsSchema = z.object({
  nivel: z.enum(['ccaa', 'provincia']).default('ccaa'),
});
export type GeoParams = z.infer<typeof geoParamsSchema>;

export const heatmapParamsSchema = z.object({
  dim: z.enum(['area', 'ccaa']).default('area'),
});
export type HeatmapParams = z.infer<typeof heatmapParamsSchema>;

export const rankingParamsSchema = z.object({
  por: z.enum(['instrumento', 'area', 'origen', 'tipoAyuda', 'ccaa']).default('instrumento'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type RankingParams = z.infer<typeof rankingParamsSchema>;

/** Bin widths for the porcentaje_aportacion histogram; must divide 100. */
export const DISTRIBUTION_BIN_WIDTHS = [1, 2, 5, 10, 20, 25] as const;

export const distributionParamsSchema = z.object({
  ancho: z.coerce
    .number()
    .refine((w): w is (typeof DISTRIBUTION_BIN_WIDTHS)[number] =>
      DISTRIBUTION_BIN_WIDTHS.includes(w as (typeof DISTRIBUTION_BIN_WIDTHS)[number]),
    )
    .default(5),
});
export type DistributionParams = z.infer<typeof distributionParamsSchema>;

export const companiesParamsSchema = z.object({
  minProyectos: z.coerce.number().int().min(1).default(2),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  ordenar: z.enum(['proyectos', 'aportacion']).default('proyectos'),
});
export type CompaniesParams = z.infer<typeof companiesParamsSchema>;
