import type { FastifyPluginAsync } from 'fastify';
import type { MetaResponse } from '@cdti/shared';
import { whitelists } from '../whitelists.js';

/** GET /api/meta — filter options, slider ranges and ingest info for app bootstrap. */
export const metaRoutes: FastifyPluginAsync = async (app) => {
  app.get('/meta', async (): Promise<MetaResponse> => {
    return {
      ingest: whitelists.ingest,
      options: {
        anios: whitelists.anios,
        ccaa: [...whitelists.ccaa],
        provincias: whitelists.provinciasPorCcaa,
        instrumentos: [...whitelists.instrumentos],
        areas: [...whitelists.areas],
        origenes: [...whitelists.origenes],
        tiposAyuda: [...whitelists.tiposAyuda],
        tiposEntidad: [...whitelists.tiposEntidad],
      },
      rangos: whitelists.rangos,
    };
  });
};
