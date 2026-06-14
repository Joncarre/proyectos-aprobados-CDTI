/** Response DTOs of the read-only analytics API. Single source of truth for both sides. */

export interface ProjectItem {
  id: number;
  razonSocial: string;
  nif: string;
  titulo: string;
  pyme: boolean | null;
  fechaAprobacion: string; // ISO date
  anio: number;
  mes: number;
  trimestre: number;
  tipoEntidad: string | null;
  ccaa: string;
  provincia: string;
  localidad: string | null;
  codigoPostal: string | null;
  tipoAyuda: string | null;
  instrumento: string | null;
  areaSectorial: string | null;
  cnae: string | null;
  origenFondos: string | null;
  presupuesto: number | null;
  aportacionCdti: number | null;
  porcentajeAportacion: number | null;
}

export interface Aggregates {
  proyectos: number;
  empresas: number;
  presupuestoTotal: number;
  aportacionTotal: number;
  pctMedio: number | null;
  pctPymes: number | null;
}

export interface ProjectsResponse {
  items: ProjectItem[];
  total: number;
  page: number;
  pageSize: number;
  aggregates: Aggregates;
}

export interface TimeseriesPoint {
  periodo: string; // "2020" or "2020-03"
  grupo: string | null;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

export interface GeoRow {
  ccaa: string;
  provincia: string | null;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

export interface HeatmapCell {
  anio: number;
  categoria: string;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

export interface RankingRow {
  categoria: string;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
}

/** Histogram of porcentaje_aportacion, optionally decomposed by a category.
 *  `bins` holds project counts per 5-point bucket (length 20: 0-5 … 95-100). */
export interface DistributionSeries {
  categoria: string; // "Total" when not decomposed
  total: number;
  pctMedio: number | null;
  bins: number[];
}

export interface DistributionResponse {
  binWidth: number;
  series: DistributionSeries[];
}

/** Per-year value of each header KPI, for the sparklines and year-over-year deltas. */
export interface KpiTrendPoint {
  anio: number;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
  pctPymes: number | null;
}

/** Header KPI metrics aggregated over a single date window. */
export interface KpiWindowMetrics {
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
  pctPymes: number | null;
}

/**
 * Trailing-12-months comparison for the header deltas: `current` is the year
 * ending on the last-update date (`refDate`); `previous` is the year before it.
 */
export interface KpiWindowResponse {
  refDate: string; // YYYY-MM-DD (ingest / last-update date)
  current: KpiWindowMetrics;
  previous: KpiWindowMetrics;
}

export interface CohortRow {
  anio: number;
  nuevas: number; // companies receiving CDTI aid for the first time ever this year
  recurrentes: number; // companies that had a prior CDTI project
}

export interface SeasonalityRow {
  mes: number; // 1-12
  proyectos: number;
  aportacion: number;
}

export interface PymeGroup {
  grupo: 'pyme' | 'no';
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
  ticketMedio: number; // aportacion / proyectos
}

export interface CompanyRow {
  nif: string;
  razonSocial: string;
  proyectos: number;
  presupuesto: number;
  aportacion: number;
  pctMedio: number | null;
  primerAnio: number;
  ultimoAnio: number;
}

export interface TreemapRow {
  area: string;
  instrumento: string;
  proyectos: number;
  aportacion: number;
}

export interface ProvinciaOption {
  ccaa: string;
  provincia: string;
}

export interface MetaResponse {
  ingest: {
    ingestedAt: string;
    nProjects: number;
    nCompanies: number;
    nSourceFiles: number;
  };
  options: {
    anios: number[];
    ccaa: string[];
    provincias: ProvinciaOption[];
    instrumentos: string[];
    areas: string[];
    origenes: string[];
    tiposAyuda: string[];
    tiposEntidad: string[];
  };
  rangos: {
    presupuesto: { min: number; max: number };
    aportacion: { min: number; max: number };
  };
}

export interface ApiErrorResponse {
  error: string;
  details?: Array<{ param: string; message: string }>;
}
