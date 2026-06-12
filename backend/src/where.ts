import type { DuckDBValue } from '@duckdb/node-api';
import type { ProjectFilters } from '@cdti/shared';

export interface WhereClause {
  where: string; // "" or "WHERE ..."
  params: DuckDBValue[];
}

const stripAccents = (value: string): string => value.normalize('NFD').replace(/\p{M}+/gu, '');
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (match) => `\\${match}`);

/**
 * Translates the validated global filters into a parameterised WHERE clause.
 * Column names are hardcoded here; user input only ever lands in `params`.
 */
export function buildWhere(filters: ProjectFilters): WhereClause {
  const conditions: string[] = [];
  const params: DuckDBValue[] = [];

  const inList = (column: string, values: ReadonlyArray<string | number> | undefined): void => {
    if (!values?.length) return;
    conditions.push(`${column} IN (${values.map(() => '?').join(', ')})`);
    params.push(...values);
  };

  const compare = (column: string, op: '>=' | '<=', value: number | undefined): void => {
    if (value === undefined) return;
    conditions.push(`${column} ${op} ?`);
    params.push(value);
  };

  inList('anio', filters.anios);
  inList('mes', filters.meses);
  inList('ccaa', filters.ccaa);
  inList('provincia', filters.provincias);
  inList('instrumento', filters.instrumentos);
  inList('area_sectorial', filters.areas);
  inList('origen_fondos', filters.origenes);
  inList('tipo_ayuda', filters.tiposAyuda);

  compare('presupuesto', '>=', filters.presupuestoMin);
  compare('presupuesto', '<=', filters.presupuestoMax);
  compare('aportacion_cdti', '>=', filters.aportacionMin);
  compare('aportacion_cdti', '<=', filters.aportacionMax);
  compare('porcentaje_aportacion', '>=', filters.pctMin);
  compare('porcentaje_aportacion', '<=', filters.pctMax);

  if (filters.pyme !== undefined) {
    conditions.push('pyme = ?');
    params.push(filters.pyme === 'si');
  }

  if (filters.nif !== undefined) {
    conditions.push('nif = ?');
    params.push(filters.nif.toUpperCase().replaceAll('-', ''));
  }

  if (filters.q !== undefined) {
    const pattern = `%${escapeLike(stripAccents(filters.q.toLowerCase()))}%`;
    conditions.push(
      `(strip_accents(lower(titulo)) LIKE ? ESCAPE '\\' OR strip_accents(lower(razon_social)) LIKE ? ESCAPE '\\')`,
    );
    params.push(pattern, pattern);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

/** Appends an extra fixed (non-parameterised) condition to a WhereClause. */
export function andWhere(clause: WhereClause, extraCondition: string): WhereClause {
  return {
    where:
      clause.where === '' ? `WHERE ${extraCondition}` : `${clause.where} AND ${extraCondition}`,
    params: clause.params,
  };
}
