// CDTI read-only analytics API.
// Security baseline: helmet headers, CORS restricted to the frontend origin,
// rate limiting, parameterised SQL only, and no write endpoint whatsoever
// (the database is opened in READ_ONLY mode; ingest runs solely via CLI).

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { initDb } from './db.js';
import { loadWhitelists } from './whitelists.js';
import { ApiValidationError } from './validation.js';
import { metaRoutes } from './routes/meta.js';
import { projectsRoutes } from './routes/projects.js';
import { statsRoutes } from './routes/stats.js';
import { timeseriesRoutes } from './routes/timeseries.js';
import { geoRoutes } from './routes/geo.js';
import { heatmapRoutes } from './routes/heatmap.js';
import { rankingsRoutes } from './routes/rankings.js';
import { distributionRoutes } from './routes/distribution.js';
import { companiesRoutes } from './routes/companies.js';
import { treemapRoutes } from './routes/treemap.js';
import { exportRoutes } from './routes/export.js';
import { cohortsRoutes } from './routes/cohorts.js';
import { seasonalityRoutes } from './routes/seasonality.js';
import { pymeRoutes } from './routes/pyme.js';
import { kpiTrendsRoutes } from './routes/kpiTrends.js';

const app = Fastify({ logger: true });

// CORP must allow cross-origin reads: the SPA lives on another origin (5173)
// and CORS already restricts who can actually consume the API.
await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } });
await app.register(cors, { origin: config.corsOrigin, methods: ['GET'] });
await app.register(rateLimit, { max: config.rateLimitMax, timeWindow: '1 minute' });

// Authentication extension point (disabled). When the CDTI deployment requires
// it, set AUTH_ENABLED=true and implement the verification below.
if (config.authEnabled) {
  app.addHook('onRequest', async () => {
    throw Object.assign(new Error('Autenticación no implementada'), { statusCode: 501 });
  });
}

app.setErrorHandler((error: unknown, request, reply) => {
  if (error instanceof ApiValidationError) {
    return reply.code(400).send({ error: error.message, details: error.details });
  }
  if (error instanceof Error) {
    const statusCode =
      'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : undefined;
    if (statusCode !== undefined && statusCode < 500) {
      return reply.code(statusCode).send({ error: error.message });
    }
  }
  request.log.error(error);
  return reply.code(500).send({ error: 'Error interno' });
});

app.get('/health', () => ({ status: 'ok' }));

await initDb(config.dbPath);
await loadWhitelists();

await app.register(
  async (api) => {
    await api.register(metaRoutes);
    await api.register(projectsRoutes);
    await api.register(statsRoutes);
    await api.register(timeseriesRoutes);
    await api.register(geoRoutes);
    await api.register(heatmapRoutes);
    await api.register(rankingsRoutes);
    await api.register(distributionRoutes);
    await api.register(companiesRoutes);
    await api.register(treemapRoutes);
    await api.register(exportRoutes);
    await api.register(cohortsRoutes);
    await api.register(seasonalityRoutes);
    await api.register(pymeRoutes);
    await api.register(kpiTrendsRoutes);
  },
  { prefix: '/api' },
);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
