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

export interface DistributionBin {
  desde: number; // inclusive
  hasta: number; // exclusive (last bin includes 100)
  proyectos: number;
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
