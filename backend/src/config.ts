import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

export const REPO_ROOT = resolve(import.meta.dirname, '../..');

loadEnv({ path: resolve(REPO_ROOT, '.env'), quiet: true });

export const config = {
  host: process.env.API_HOST ?? '127.0.0.1',
  port: Number(process.env.API_PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  dbPath: resolve(REPO_ROOT, process.env.DUCKDB_PATH ?? './data/cdti.duckdb'),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  /** Extension point: flip to true and implement the onRequest hook when the
   *  CDTI deployment requires authentication. */
  authEnabled: process.env.AUTH_ENABLED === 'true',
} as const;
