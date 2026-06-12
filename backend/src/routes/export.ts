import type { FastifyPluginAsync } from 'fastify';
import { query } from '../db.js';
import { parseFilters } from '../validation.js';
import { buildWhere } from '../where.js';

interface ExportRow {
  fecha: string | null;
  empresa: string;
  nif: string;
  titulo: string;
  pyme: boolean | null;
  tipo_entidad: string | null;
  ccaa: string;
  provincia: string;
  localidad: string | null;
  codigo_postal: string | null;
  tipo_ayuda: string | null;
  instrumento: string | null;
  area_sectorial: string | null;
  cnae: string | null;
  origen_fondos: string | null;
  presupuesto: number | null;
  aportacion: number | null;
  pct: number | null;
}

const HEADER = [
  'Fecha aprobación',
  'Empresa',
  'NIF',
  'Título',
  'PYME',
  'Tipo entidad',
  'CCAA',
  'Provincia',
  'Localidad',
  'Código postal',
  'Tipo de ayuda',
  'Instrumento financiero',
  'Área sectorial',
  'CNAE',
  'Origen de fondos',
  'Presupuesto (€)',
  'Aportación CDTI (€)',
  '% aportación',
];

/** Spanish-Excel-friendly CSV: semicolon separator, decimal comma, UTF-8 BOM. */
const csvField = (value: string | number | boolean | null): string => {
  if (value === null) return '';
  if (typeof value === 'number') return String(value).replace('.', ',');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return /[;"\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
};

/** GET /api/projects/export — full filtered result set as CSV download. */
export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/projects/export', async (request, reply) => {
    const filters = parseFilters(request.query);
    const clause = buildWhere(filters);

    const rows = await query<ExportRow>(
      `
      SELECT
        fecha_aprobacion::VARCHAR AS fecha, razon_social AS empresa, nif, titulo, pyme,
        tipo_entidad, ccaa, provincia, localidad, codigo_postal, tipo_ayuda, instrumento,
        area_sectorial, cnae, origen_fondos,
        presupuesto::DOUBLE AS presupuesto, aportacion_cdti::DOUBLE AS aportacion,
        porcentaje_aportacion::DOUBLE AS pct
      FROM projects ${clause.where}
      ORDER BY fecha_aprobacion, id`,
      clause.params,
    );

    const lines = rows.map((row) =>
      [
        row.fecha,
        row.empresa,
        row.nif,
        row.titulo,
        row.pyme,
        row.tipo_entidad,
        row.ccaa,
        row.provincia,
        row.localidad,
        row.codigo_postal,
        row.tipo_ayuda,
        row.instrumento,
        row.area_sectorial,
        row.cnae,
        row.origen_fondos,
        row.presupuesto,
        row.aportacion,
        row.pct,
      ]
        .map(csvField)
        .join(';'),
    );
    const bom = String.fromCharCode(0xfeff); // lets Excel detect UTF-8
    const csv = bom + [HEADER.join(';'), ...lines].join('\r\n');

    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', 'attachment; filename="proyectos-cdti.csv"')
      .send(csv);
  });
};
