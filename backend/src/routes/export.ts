import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { ProjectItem } from '@cdti/shared';
import { query } from '../db.js';
import { parseFilters, parseQuery } from '../validation.js';
import { buildWhere } from '../where.js';
import { ITEM_COLUMNS } from './projects.js';

const exportParamsSchema = z.object({
  fmt: z.enum(['csv', 'json', 'xml', 'toon']).default('csv'),
});

/** CSV column order: header label + ProjectItem key. */
const CSV_COLUMNS: Array<[string, keyof ProjectItem]> = [
  ['Fecha aprobación', 'fechaAprobacion'],
  ['Empresa', 'razonSocial'],
  ['NIF', 'nif'],
  ['Título', 'titulo'],
  ['PYME', 'pyme'],
  ['Tipo entidad', 'tipoEntidad'],
  ['CCAA', 'ccaa'],
  ['Provincia', 'provincia'],
  ['Localidad', 'localidad'],
  ['Código postal', 'codigoPostal'],
  ['Tipo de ayuda', 'tipoAyuda'],
  ['Instrumento financiero', 'instrumento'],
  ['Área sectorial', 'areaSectorial'],
  ['CNAE', 'cnae'],
  ['Origen de fondos', 'origenFondos'],
  ['Presupuesto (€)', 'presupuesto'],
  ['Aportación CDTI (€)', 'aportacionCdti'],
  ['% aportación', 'porcentajeAportacion'],
];

/** Spanish-Excel-friendly CSV field: decimal comma, quoted when needed. */
const csvField = (value: ProjectItem[keyof ProjectItem]): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value).replace('.', ',');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  const text = String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const xmlEscape = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function toCsv(rows: ProjectItem[]): string {
  const bom = String.fromCharCode(0xfeff); // lets Excel detect UTF-8
  const header = CSV_COLUMNS.map(([label]) => label).join(';');
  const lines = rows.map((row) => CSV_COLUMNS.map(([, key]) => csvField(row[key])).join(';'));
  return bom + [header, ...lines].join('\r\n');
}

function toXml(rows: ProjectItem[]): string {
  const items = rows.map((row) => {
    const fields = Object.entries(row)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `    <${key}>${xmlEscape(String(value))}</${key}>`)
      .join('\n');
    return `  <proyecto>\n${fields}\n  </proyecto>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<proyectos total="${rows.length}">\n${items.join('\n')}\n</proyectos>\n`;
}

// ── TOON (Token-Oriented Object Notation) — compact tabular encoding for LLMs.
// Our rows are a flat array of uniform objects, which is exactly TOON's optimal
// case: one header `[N]{fields}:` followed by one comma-delimited line per row.

const TOON_FIELDS = CSV_COLUMNS.map(([, key]) => key);

const toonEscape = (value: string): string =>
  value.replace(/[\\"\n\r\t]/g, (char) => {
    switch (char) {
      case '\\':
        return '\\\\';
      case '"':
        return '\\"';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      default:
        return '\\t';
    }
  });

const hasControlChar = (text: string): boolean => {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) < 0x20) return true;
  }
  return false;
};

/** Quote a string only when the TOON grammar requires it (spec §7.2). */
const toonNeedsQuote = (text: string): boolean =>
  text === '' ||
  text !== text.trim() ||
  text === 'true' ||
  text === 'false' ||
  text === 'null' ||
  text.startsWith('-') ||
  !Number.isNaN(Number(text)) || // numeric-looking strings stay strings (e.g. postal codes)
  /[:"\\[\]{},]/.test(text) ||
  hasControlChar(text);

const toonScalar = (value: ProjectItem[keyof ProjectItem]): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value); // canonical for our integer/decimal ranges
  return toonNeedsQuote(value) ? `"${toonEscape(value)}"` : value;
};

function toToon(rows: ProjectItem[]): string {
  const header = `[${rows.length}]{${TOON_FIELDS.join(',')}}:`;
  const lines = rows.map((row) => '  ' + TOON_FIELDS.map((key) => toonScalar(row[key])).join(','));
  return [header, ...lines].join('\n') + '\n';
}

const send = (reply: FastifyReply, body: string, contentType: string, ext: string) =>
  reply
    .header('content-type', `${contentType}; charset=utf-8`)
    .header('content-disposition', `attachment; filename="proyectos-cdti.${ext}"`)
    .send(body);

/** GET /api/projects/export?fmt=csv|json|xml|toon — full filtered result set as a download. */
export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/projects/export', async (request, reply) => {
    const filters = parseFilters(request.query);
    const { fmt } = parseQuery(exportParamsSchema, request.query);
    const clause = buildWhere(filters);

    const rows = await query<ProjectItem>(
      `SELECT ${ITEM_COLUMNS} FROM projects ${clause.where} ORDER BY fecha_aprobacion, id`,
      clause.params,
    );

    switch (fmt) {
      case 'json':
        return send(reply, JSON.stringify(rows, null, 1), 'application/json', 'json');
      case 'xml':
        return send(reply, toXml(rows), 'application/xml', 'xml');
      case 'toon':
        return send(reply, toToon(rows), 'text/plain', 'toon');
      default:
        return send(reply, toCsv(rows), 'text/csv', 'csv');
    }
  });
};
