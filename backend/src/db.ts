import { existsSync } from 'node:fs';
import { DuckDBInstance, type DuckDBConnection, type DuckDBValue } from '@duckdb/node-api';

// Small round-robin pool: each connection runs one query at a time inside
// DuckDB's native threads, so a handful of connections covers concurrent requests.
let pool: DuckDBConnection[] = [];
let next = 0;

export async function initDb(dbPath: string, poolSize = 4): Promise<void> {
  if (!existsSync(dbPath)) {
    throw new Error(`Database not found at ${dbPath}. Run "npm run ingest" first.`);
  }
  const instance = await DuckDBInstance.create(dbPath, { access_mode: 'READ_ONLY' });
  pool = await Promise.all(Array.from({ length: poolSize }, () => instance.connect()));
}

/** Runs a parameterised read query and returns JSON-safe row objects. */
export async function query<T>(sql: string, params: DuckDBValue[] = []): Promise<T[]> {
  const connection = pool[next]!;
  next = (next + 1) % pool.length;
  const reader = await connection.runAndReadAll(sql, params);
  return reader.getRowObjectsJson() as T[];
}
