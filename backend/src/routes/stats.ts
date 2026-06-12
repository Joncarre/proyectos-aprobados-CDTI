import type { FastifyPluginAsync } from 'fastify';
import type { Aggregates } from '@cdti/shared';
import { fetchAggregates } from '../aggregates.js';
import { parseFilters } from '../validation.js';
import { buildWhere } from '../where.js';

/** GET /api/stats — header KPIs for the filtered set. */
export const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stats', async (request): Promise<Aggregates> => {
    const filters = parseFilters(request.query);
    return fetchAggregates(buildWhere(filters));
  });
};
