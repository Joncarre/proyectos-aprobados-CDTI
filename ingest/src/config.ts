import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

export const REPO_ROOT = resolve(import.meta.dirname, '../..');

loadEnv({ path: resolve(REPO_ROOT, '.env'), quiet: true });

const fromRoot = (path: string): string => resolve(REPO_ROOT, path);

export const RAW_DATA_DIR = fromRoot(process.env.RAW_DATA_DIR ?? './data/raw');
export const DUCKDB_PATH = fromRoot(process.env.DUCKDB_PATH ?? './data/cdti.duckdb');
export const QUALITY_REPORT_PATH = fromRoot('./docs/data-quality.md');

/** DuckDB expects forward slashes, also on Windows. */
export const toDuckDbPath = (path: string): string => path.replaceAll('\\', '/');
