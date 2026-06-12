import { writeFile } from 'node:fs/promises';
import type { DuckDBConnection } from '@duckdb/node-api';
import { CATEGORICAL_COLUMNS } from './pipeline.js';

type Row = Record<string, string | null>;

type Cell = string | null | undefined;

const num = (value: Cell): number => Number(value ?? 0);
const fmtInt = (value: Cell): string => num(value).toLocaleString('es-ES');
const fmtMoney = (value: Cell): string =>
  num(value).toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';

async function q(con: DuckDBConnection, sql: string): Promise<Row[]> {
  return (await con.runAndReadAll(sql)).getRowObjectsJson() as Row[];
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

/** Queries the freshly built database and renders docs/data-quality.md. */
export async function writeQualityReport(con: DuckDBConnection, outPath: string): Promise<void> {
  const [totals] = await q(
    con,
    `
    SELECT count(*)::INT AS n, count(DISTINCT nif)::INT AS nifs,
           min(fecha_aprobacion) AS fecha_min, max(fecha_aprobacion) AS fecha_max,
           sum(presupuesto) AS presupuesto, sum(aportacion_cdti) AS aportacion
    FROM projects`,
  );

  const perYear = await q(
    con,
    `
    SELECT anio, count(*)::INT AS n, sum(presupuesto) AS presupuesto,
           sum(aportacion_cdti) AS aportacion, round(avg(porcentaje_aportacion), 2) AS pct_medio
    FROM projects GROUP BY anio ORDER BY anio`,
  );

  const PROJECT_COLUMNS = [
    'razon_social',
    'nif',
    'titulo',
    'pyme',
    'fecha_aprobacion',
    'tipo_entidad',
    'ccaa',
    'provincia',
    'localidad',
    'codigo_postal',
    'tipo_ayuda',
    'instrumento',
    'area_sectorial',
    'cnae',
    'origen_fondos',
    'presupuesto',
    'aportacion_cdti',
    'porcentaje_aportacion',
    'ultima_actualizacion',
  ];
  const nullCounts = await q(
    con,
    `
    SELECT ${PROJECT_COLUMNS.map((c) => `sum(CASE WHEN ${c} IS NULL THEN 1 ELSE 0 END)::INT AS ${c}`).join(', ')}
    FROM projects`,
  );
  const nullRows = PROJECT_COLUMNS.map((c) => ({
    col: c,
    nulls: num(nullCounts[0]?.[c] ?? '0'),
  })).filter((r) => r.nulls > 0);

  const changedMappings = await q(
    con,
    `
    SELECT column_name, original_value, clean_value, occurrences::INT AS occurrences
    FROM category_mappings
    WHERE original_value <> clean_value
    ORDER BY column_name, occurrences DESC`,
  );

  const distinctCats = await q(
    con,
    `
    SELECT column_name, count(DISTINCT original_value)::INT AS originales,
           count(DISTINCT clean_value)::INT AS limpios
    FROM category_mappings GROUP BY column_name ORDER BY column_name`,
  );

  const emptyCats = await q(
    con,
    `
    SELECT ${CATEGORICAL_COLUMNS.map((c) => `sum(CASE WHEN ${c.clean} IS NULL THEN 1 ELSE 0 END)::INT AS ${c.clean}`).join(', ')}
    FROM projects`,
  );

  const [dupes] = await q(
    con,
    `
    WITH d AS (
      SELECT count(*) AS c FROM projects
      GROUP BY nif, titulo, fecha_aprobacion HAVING count(*) > 1
    )
    SELECT count(*)::INT AS grupos, coalesce(sum(c - 1), 0)::INT AS filas_extra FROM d`,
  );

  const [checks] = await q(
    con,
    `
    SELECT
      sum(CASE WHEN aportacion_cdti > presupuesto THEN 1 ELSE 0 END)::INT AS aportacion_mayor,
      sum(CASE WHEN porcentaje_aportacion IS NULL THEN 1 ELSE 0 END)::INT AS sin_pct,
      sum(CASE WHEN length(codigo_postal) <> 5 THEN 1 ELSE 0 END)::INT AS cp_invalidos,
      min(porcentaje_aportacion) AS pct_min,
      round(avg(porcentaje_aportacion), 2) AS pct_avg,
      round(median(porcentaje_aportacion), 2) AS pct_median,
      max(porcentaje_aportacion) AS pct_max,
      min(presupuesto) AS pres_min,
      max(presupuesto) AS pres_max
    FROM projects`,
  );

  const [cpFixed] = await q(
    con,
    `
    SELECT count(*)::INT AS n FROM raw_projects WHERE trim(CodigoPostal) ~ '^[0-9]{4}$'`,
  );

  const topCompanies = await q(
    con,
    `
    SELECT razon_social, nif, n_proyectos::INT AS n_proyectos, aportacion_total
    FROM companies ORDER BY n_proyectos DESC, aportacion_total DESC LIMIT 10`,
  );

  const [recurrence] = await q(
    con,
    `
    SELECT count(*)::INT AS total,
           sum(CASE WHEN n_proyectos > 1 THEN 1 ELSE 0 END)::INT AS recurrentes
    FROM companies`,
  );

  const md = `# Informe de calidad de datos

> Generado automáticamente por \`npm run ingest\` el ${new Date().toLocaleString('es-ES')}.
> Se regenera en cada ejecución; no editar a mano.

## Resumen

| Métrica | Valor |
|---|---|
| Registros cargados | **${fmtInt(totals!.n)}** |
| Empresas distintas (NIF) | ${fmtInt(totals!.nifs)} |
| Empresas con más de un proyecto | ${fmtInt(recurrence!.recurrentes)} de ${fmtInt(recurrence!.total)} |
| Rango de fechas de aprobación | ${totals!.fecha_min} → ${totals!.fecha_max} |
| Presupuesto total | ${fmtMoney(totals!.presupuesto)} |
| Aportación CDTI total | ${fmtMoney(totals!.aportacion)} |

## Registros por año

${table(
  ['Año', 'Proyectos', 'Presupuesto', 'Aportación CDTI', '% medio aportación'],
  perYear.map((r) => [
    r.anio ?? '—',
    fmtInt(r.n),
    fmtMoney(r.presupuesto),
    fmtMoney(r.aportacion),
    `${r.pct_medio} %`,
  ]),
)}

## Valores nulos tras la normalización

${
  nullRows.length === 0
    ? 'Ninguna columna contiene valores nulos.'
    : table(
        ['Columna', 'Nulos'],
        nullRows.map((r) => [`\`${r.col}\``, r.nulls.toLocaleString('es-ES')]),
      )
}

Los valores vacíos del origen (cadenas vacías) se convierten a \`NULL\` en la ingesta:
${CATEGORICAL_COLUMNS.map((c) => `\`${c.clean}\`: ${fmtInt(emptyCats[0]?.[c.clean] ?? '0')}`).join(' · ')}.

## Normalización de categorías

Estrategia data-driven y reproducible: por columna, cada valor se limpia (espacios
recortados y colapsados, puntos finales eliminados) y las variantes que solo difieren en
mayúsculas/tildes se agrupan, eligiendo como valor canónico la variante más frecuente.
El mapa completo queda persistido en la tabla \`category_mappings\` de la base de datos.

${table(
  ['Columna', 'Valores originales', 'Valores limpios'],
  distinctCats.map((r) => [`\`${r.column_name}\``, fmtInt(r.originales), fmtInt(r.limpios)]),
)}

### Mapa «valor original → valor limpio» (solo entradas con cambios)

${
  changedMappings.length === 0
    ? 'Ningún valor necesitó cambios.'
    : table(
        ['Columna', 'Original', 'Limpio', 'Registros'],
        changedMappings.map((r) => [
          `\`${r.column_name}\``,
          `«${r.original_value}»`,
          `«${r.clean_value}»`,
          fmtInt(r.occurrences),
        ]),
      )
}

## Comprobaciones de consistencia

| Comprobación | Resultado |
|---|---|
| Duplicados lógicos (mismo NIF + título + fecha) | ${fmtInt(dupes!.grupos)} grupos (${fmtInt(dupes!.filas_extra)} filas extra) |
| Registros con aportación > presupuesto | ${fmtInt(checks!.aportacion_mayor)} |
| Registros sin % de aportación calculable | ${fmtInt(checks!.sin_pct)} |
| Códigos postales corregidos (4 dígitos → 5 con cero inicial) | ${fmtInt(cpFixed!.n)} |
| Códigos postales aún inválidos (≠ 5 dígitos) | ${fmtInt(checks!.cp_invalidos)} |
| % de aportación (mín / mediana / media / máx) | ${checks!.pct_min} / ${checks!.pct_median} / ${checks!.pct_avg} / ${checks!.pct_max} |
| Presupuesto (mín / máx) | ${fmtMoney(checks!.pres_min)} / ${fmtMoney(checks!.pres_max)} |

## Empresas con más proyectos

${table(
  ['Empresa', 'NIF', 'Proyectos', 'Aportación total'],
  topCompanies.map((r) => [
    r.razon_social ?? '—',
    r.nif ?? '—',
    fmtInt(r.n_proyectos),
    fmtMoney(r.aportacion_total),
  ]),
)}
`;

  await writeFile(outPath, md, 'utf8');
}
