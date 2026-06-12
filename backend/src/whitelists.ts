import type { MetaResponse, ProvinciaOption } from '@cdti/shared';
import { query } from './db.js';

export interface Whitelists {
  anios: number[];
  ccaa: Set<string>;
  provincias: Set<string>;
  provinciasPorCcaa: ProvinciaOption[];
  instrumentos: Set<string>;
  areas: Set<string>;
  origenes: Set<string>;
  tiposAyuda: Set<string>;
  tiposEntidad: Set<string>;
  rangos: MetaResponse['rangos'];
  ingest: MetaResponse['ingest'];
}

/** Loaded once at boot; the database only changes when the ingest CLI rebuilds it. */
export let whitelists: Whitelists;

const column = async <T>(sql: string): Promise<T[]> =>
  (await query<Record<string, T>>(sql)).map((row) => Object.values(row)[0] as T);

export async function loadWhitelists(): Promise<void> {
  const [rangos] = await query<{
    presupuestoMin: number;
    presupuestoMax: number;
    aportacionMin: number;
    aportacionMax: number;
  }>(`
    SELECT min(presupuesto)::DOUBLE AS "presupuestoMin", max(presupuesto)::DOUBLE AS "presupuestoMax",
           min(aportacion_cdti)::DOUBLE AS "aportacionMin", max(aportacion_cdti)::DOUBLE AS "aportacionMax"
    FROM projects`);

  const [ingest] = await query<{
    ingestedAt: string;
    nProjects: number;
    nCompanies: number;
    nSourceFiles: number;
  }>(`
    SELECT ingested_at::VARCHAR AS "ingestedAt", n_projects::INT AS "nProjects",
           n_companies::INT AS "nCompanies", n_source_files::INT AS "nSourceFiles"
    FROM ingest_meta`);

  whitelists = {
    anios: await column<number>('SELECT anio::INT FROM dim_anios'),
    ccaa: new Set(await column<string>('SELECT ccaa FROM dim_ccaa')),
    provincias: new Set(await column<string>('SELECT provincia FROM dim_provincias')),
    provinciasPorCcaa: await query<ProvinciaOption>('SELECT ccaa, provincia FROM dim_provincias'),
    instrumentos: new Set(await column<string>('SELECT instrumento FROM dim_instrumentos')),
    areas: new Set(await column<string>('SELECT area_sectorial FROM dim_areas_sectoriales')),
    origenes: new Set(await column<string>('SELECT origen_fondos FROM dim_origenes_fondos')),
    tiposAyuda: new Set(await column<string>('SELECT tipo_ayuda FROM dim_tipos_ayuda')),
    tiposEntidad: new Set(await column<string>('SELECT tipo_entidad FROM dim_tipos_entidad')),
    rangos: {
      presupuesto: { min: rangos!.presupuestoMin, max: rangos!.presupuestoMax },
      aportacion: { min: rangos!.aportacionMin, max: rangos!.aportacionMax },
    },
    ingest: ingest!,
  };
}
