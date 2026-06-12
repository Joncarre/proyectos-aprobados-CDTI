// CDTI read-only analytics API (FASE 2).
// FASE 0 skeleton: a Fastify instance with a health endpoint to verify the toolchain.

import Fastify from 'fastify';
import { config } from 'dotenv';
import { resolve } from 'node:path';

// .env lives at the repository root, one level above this workspace
config({ path: resolve(import.meta.dirname, '../../.env') });

const host = process.env.API_HOST ?? '127.0.0.1';
const port = Number(process.env.API_PORT ?? 3001);

const app = Fastify({ logger: true });

app.get('/health', () => ({ status: 'ok' }));

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
