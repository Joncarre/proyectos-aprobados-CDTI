import type { FastifyPluginAsync } from 'fastify';
import {
  paginationSchema,
  type ProjectsResponse,
  type ProjectItem,
  type SortField,
} from '@cdti/shared';
import { query } from '../db.js';
import { fetchAggregates } from '../aggregates.js';
import { parseFilters, parseQuery } from '../validation.js';
import { buildWhere } from '../where.js';

/** User-facing sort keys → real columns. Never interpolate raw input into ORDER BY. */
const SORT_COLUMNS: Record<SortField, string> = {
  fecha: 'fecha_aprobacion',
  presupuesto: 'presupuesto',
  aportacion: 'aportacion_cdti',
  pct: 'porcentaje_aportacion',
  empresa: 'razon_social',
  anio: 'anio',
};

const ITEM_COLUMNS = `
  id::INT AS id,
  razon_social AS "razonSocial",
  nif,
  titulo,
  pyme,
  fecha_aprobacion::VARCHAR AS "fechaAprobacion",
  anio::INT AS anio,
  mes::INT AS mes,
  trimestre::INT AS trimestre,
  tipo_entidad AS "tipoEntidad",
  ccaa,
  provincia,
  localidad,
  codigo_postal AS "codigoPostal",
  tipo_ayuda AS "tipoAyuda",
  instrumento,
  area_sectorial AS "areaSectorial",
  cnae,
  origen_fondos AS "origenFondos",
  presupuesto::DOUBLE AS presupuesto,
  aportacion_cdti::DOUBLE AS "aportacionCdti",
  porcentaje_aportacion::DOUBLE AS "porcentajeAportacion"`;

/** GET /api/projects — combined filtering: paginated list + aggregates. */
export const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/projects', async (request): Promise<ProjectsResponse> => {
    const filters = parseFilters(request.query);
    const { page, pageSize, sort, order } = parseQuery(paginationSchema, request.query);
    const clause = buildWhere(filters);

    const direction = order === 'asc' ? 'ASC' : 'DESC';
    const items = await query<ProjectItem>(
      `
      SELECT ${ITEM_COLUMNS}
      FROM projects ${clause.where}
      ORDER BY ${SORT_COLUMNS[sort]} ${direction} NULLS LAST, id
      LIMIT ? OFFSET ?`,
      [...clause.params, pageSize, (page - 1) * pageSize],
    );

    const aggregates = await fetchAggregates(clause);
    return { items, total: aggregates.proyectos, page, pageSize, aggregates };
  });
};
