import type { DuckDBConnection } from '@duckdb/node-api';

/** Raw JSON fields, in source order. All read as VARCHAR: nothing is trusted before cleaning. */
const RAW_FIELDS = [
  'RazonSocial',
  'NIFRazonSocial',
  'TipoEntidad',
  'PYME',
  'TituloProyecto',
  'FechaAprobacionResolucion',
  'CCAA',
  'Provincia',
  'Localidad',
  'CodigoPostal',
  'TipoAyuda',
  'InstrumentoFinanciero',
  'AreaSectorial',
  'CNAE',
  'OrigenFondos',
  'Presupuesto',
  'AportacionCDTI',
  'UltimaFechaActualizacion',
] as const;

/** Categorical columns that go through data-driven canonicalisation. */
export const CATEGORICAL_COLUMNS: ReadonlyArray<{ raw: string; clean: string }> = [
  { raw: 'TipoEntidad', clean: 'tipo_entidad' },
  { raw: 'CCAA', clean: 'ccaa' },
  { raw: 'Provincia', clean: 'provincia' },
  { raw: 'Localidad', clean: 'localidad' },
  { raw: 'TipoAyuda', clean: 'tipo_ayuda' },
  { raw: 'InstrumentoFinanciero', clean: 'instrumento' },
  { raw: 'AreaSectorial', clean: 'area_sectorial' },
  { raw: 'CNAE', clean: 'cnae' },
  { raw: 'OrigenFondos', clean: 'origen_fondos' },
];

/** Spanish-formatted amount ("347.644,00 €") → DECIMAL(15,2). Empty/invalid → NULL. */
const money = (col: string): string =>
  `try_cast(replace(regexp_replace(trim(${col}), '[^0-9,]', '', 'g'), ',', '.') AS DECIMAL(15,2))`;

/** DD/MM/YYYY → DATE. Empty/invalid → NULL. */
const date = (col: string): string => `try_strptime(trim(${col}), '%d/%m/%Y')::DATE`;

/**
 * Loads the raw JSON files as-is into `raw_projects`, which stays in the database
 * for traceability (every original value remains queryable).
 */
export async function loadRawProjects(con: DuckDBConnection, rawGlob: string): Promise<void> {
  const columns = RAW_FIELDS.map((f) => `${f}: 'VARCHAR'`).join(', ');
  await con.run(`
    CREATE OR REPLACE TABLE raw_projects AS
    SELECT *, parse_filename(filename) AS source_file
    FROM read_json('${rawGlob}', format = 'array', columns = {${columns}}, filename = true)
  `);
}

/**
 * Builds `category_mappings` (column_name, original_value, clean_value, occurrences).
 *
 * Strategy, applied independently per categorical column:
 *  1. display value = trim + collapse inner whitespace + strip trailing dots
 *  2. variants are grouped by a normalisation key (lowercase + accents stripped)
 *  3. each group maps to its most frequent display variant (ties: alphabetical)
 * This is fully data-driven and reproducible: no hand-maintained synonym lists.
 */
export async function buildCategoryMappings(con: DuckDBConnection): Promise<void> {
  const sources = CATEGORICAL_COLUMNS.map(
    (c) => `SELECT '${c.raw}' AS column_name, ${c.raw} AS original_value FROM raw_projects`,
  ).join('\n      UNION ALL ');

  await con.run(`
    CREATE OR REPLACE TABLE category_mappings AS
    WITH source_values AS (
      ${sources}
    ),
    counted AS (
      SELECT
        column_name,
        original_value,
        regexp_replace(regexp_replace(trim(original_value), '\\s+', ' ', 'g'), '\\.+$', '') AS display_value,
        count(*) AS occurrences
      FROM source_values
      WHERE original_value IS NOT NULL AND trim(original_value) <> ''
      GROUP BY 1, 2, 3
    ),
    keyed AS (
      SELECT *, lower(strip_accents(display_value)) AS norm_key FROM counted
    ),
    canonical AS (
      SELECT
        column_name,
        norm_key,
        (list(display_value ORDER BY occurrences DESC, display_value ASC))[1] AS clean_value
      FROM keyed
      GROUP BY 1, 2
    )
    SELECT k.column_name, k.original_value, c.clean_value, k.occurrences
    FROM keyed k
    JOIN canonical c USING (column_name, norm_key)
  `);
}

/**
 * Builds the main `projects` table: normalised types, canonical categories and
 * derived fields. Physically ordered by approval date so DuckDB zone maps prune
 * date/year range filters efficiently.
 */
export async function buildProjects(con: DuckDBConnection): Promise<void> {
  const mappingJoins = CATEGORICAL_COLUMNS.map(
    (c) => `
    LEFT JOIN category_mappings m_${c.clean}
      ON m_${c.clean}.column_name = '${c.raw}' AND m_${c.clean}.original_value = r.${c.raw}`,
  ).join('');

  const mappedColumns = CATEGORICAL_COLUMNS.map(
    (c) => `m_${c.clean}.clean_value AS ${c.clean}`,
  ).join(',\n      ');

  await con.run(`
    CREATE OR REPLACE TABLE projects AS
    SELECT
      row_number() OVER (ORDER BY ${date('r.FechaAprobacionResolucion')}, r.NIFRazonSocial, r.TituloProyecto) AS id,
      trim(r.RazonSocial) AS razon_social,
      upper(regexp_replace(r.NIFRazonSocial, '[^A-Za-z0-9]', '', 'g')) AS nif,
      trim(r.TituloProyecto) AS titulo,
      CASE upper(trim(r.PYME)) WHEN 'S' THEN true WHEN 'N' THEN false ELSE NULL END AS pyme,
      ${date('r.FechaAprobacionResolucion')} AS fecha_aprobacion,
      year(${date('r.FechaAprobacionResolucion')})::SMALLINT AS anio,
      month(${date('r.FechaAprobacionResolucion')})::TINYINT AS mes,
      quarter(${date('r.FechaAprobacionResolucion')})::TINYINT AS trimestre,
      ${mappedColumns},
      CASE
        WHEN trim(r.CodigoPostal) ~ '^[0-9]{4}$' THEN lpad(trim(r.CodigoPostal), 5, '0')
        ELSE nullif(trim(r.CodigoPostal), '')
      END AS codigo_postal,
      ${money('r.Presupuesto')} AS presupuesto,
      ${money('r.AportacionCDTI')} AS aportacion_cdti,
      round(${money('r.AportacionCDTI')} / nullif(${money('r.Presupuesto')}, 0) * 100, 2)::DECIMAL(5,2)
        AS porcentaje_aportacion,
      ${date('r.UltimaFechaActualizacion')} AS ultima_actualizacion,
      r.source_file
    FROM raw_projects r${mappingJoins}
    ORDER BY fecha_aprobacion, id
  `);
}

/**
 * Dimension views for filter whitelists (FASE 2) plus the recurring-companies view.
 * Views, not tables: with ~20k rows DuckDB resolves them in microseconds and they
 * can never drift from `projects`.
 */
export async function createViews(con: DuckDBConnection): Promise<void> {
  await con.run(`
    CREATE OR REPLACE VIEW dim_anios AS
    SELECT DISTINCT anio FROM projects WHERE anio IS NOT NULL ORDER BY anio;

    CREATE OR REPLACE VIEW dim_ccaa AS
    SELECT DISTINCT ccaa FROM projects WHERE ccaa IS NOT NULL ORDER BY ccaa;

    CREATE OR REPLACE VIEW dim_provincias AS
    SELECT DISTINCT ccaa, provincia FROM projects
    WHERE provincia IS NOT NULL ORDER BY ccaa, provincia;

    CREATE OR REPLACE VIEW dim_instrumentos AS
    SELECT DISTINCT instrumento FROM projects WHERE instrumento IS NOT NULL ORDER BY instrumento;

    CREATE OR REPLACE VIEW dim_areas_sectoriales AS
    SELECT DISTINCT area_sectorial FROM projects WHERE area_sectorial IS NOT NULL ORDER BY area_sectorial;

    CREATE OR REPLACE VIEW dim_origenes_fondos AS
    SELECT DISTINCT origen_fondos FROM projects WHERE origen_fondos IS NOT NULL ORDER BY origen_fondos;

    CREATE OR REPLACE VIEW dim_tipos_ayuda AS
    SELECT DISTINCT tipo_ayuda FROM projects WHERE tipo_ayuda IS NOT NULL ORDER BY tipo_ayuda;

    CREATE OR REPLACE VIEW dim_tipos_entidad AS
    SELECT DISTINCT tipo_entidad FROM projects WHERE tipo_entidad IS NOT NULL ORDER BY tipo_entidad;

    CREATE OR REPLACE VIEW companies AS
    SELECT
      nif,
      mode(razon_social) AS razon_social,
      count(*) AS n_proyectos,
      sum(presupuesto) AS presupuesto_total,
      sum(aportacion_cdti) AS aportacion_total,
      round(avg(porcentaje_aportacion), 2) AS porcentaje_medio,
      min(anio) AS primer_anio,
      max(anio) AS ultimo_anio
    FROM projects
    GROUP BY nif;
  `);
}

/**
 * ART indexes on point-filter columns. In DuckDB the heavy lifting for analytics
 * comes from columnar scans + zone maps (hence the physical ORDER BY in projects);
 * these indexes additionally speed up selective lookups (e.g. one NIF, one year).
 */
export async function createIndexes(con: DuckDBConnection): Promise<void> {
  const indexed = [
    'anio',
    'ccaa',
    'provincia',
    'instrumento',
    'area_sectorial',
    'origen_fondos',
    'nif',
  ];
  for (const col of indexed) {
    await con.run(`CREATE INDEX IF NOT EXISTS idx_projects_${col} ON projects (${col})`);
  }
}

/** Single-row metadata table: when and from what this database was built. */
export async function writeIngestMeta(con: DuckDBConnection): Promise<void> {
  await con.run(`
    CREATE OR REPLACE TABLE ingest_meta AS
    SELECT
      now()::TIMESTAMP AS ingested_at,
      (SELECT count(*) FROM projects) AS n_projects,
      (SELECT count(DISTINCT source_file) FROM projects) AS n_source_files,
      (SELECT count(DISTINCT nif) FROM projects) AS n_companies
  `);
}
