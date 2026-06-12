// CDTI ingest pipeline (CLI). Idempotent: rebuilds data/cdti.duckdb from scratch
// on every run, so re-running it always converges to the same state.

import { rm } from 'node:fs/promises';
import { DuckDBInstance } from '@duckdb/node-api';
import { DUCKDB_PATH, QUALITY_REPORT_PATH, RAW_DATA_DIR, toDuckDbPath } from './config.js';
import {
  buildCategoryMappings,
  buildProjects,
  createIndexes,
  createViews,
  loadRawProjects,
  writeIngestMeta,
} from './pipeline.js';
import { writeQualityReport } from './report.js';

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  const start = performance.now();
  await fn();
  console.log(`  ✔ ${name} (${(performance.now() - start).toFixed(0)} ms)`);
}

async function main(): Promise<void> {
  console.log('[ingest] Rebuilding database from raw JSON files');
  console.log(`  raw data: ${RAW_DATA_DIR}`);
  console.log(`  database: ${DUCKDB_PATH}\n`);

  // Full rebuild: remove any previous database (and its WAL) first
  await rm(DUCKDB_PATH, { force: true });
  await rm(`${DUCKDB_PATH}.wal`, { force: true });

  const instance = await DuckDBInstance.create(DUCKDB_PATH);
  const con = await instance.connect();
  const rawGlob = `${toDuckDbPath(RAW_DATA_DIR)}/*.json`;

  try {
    await step('load raw JSON files → raw_projects', () => loadRawProjects(con, rawGlob));
    await step('build category mappings', () => buildCategoryMappings(con));
    await step('build projects table', () => buildProjects(con));
    await step('create dimension + companies views', () => createViews(con));
    await step('create indexes', () => createIndexes(con));
    await step('write ingest metadata', () => writeIngestMeta(con));
    await step('write data quality report', () => writeQualityReport(con, QUALITY_REPORT_PATH));

    const summary = (
      await con.runAndReadAll(
        'SELECT n_projects::INT AS p, n_companies::INT AS c, n_source_files::INT AS f FROM ingest_meta',
      )
    ).getRowObjectsJson()[0] as { p: string; c: string; f: string };

    console.log(
      `\n[ingest] Done: ${Number(summary.p).toLocaleString('es-ES')} projects from ` +
        `${summary.f} files, ${Number(summary.c).toLocaleString('es-ES')} distinct companies.`,
    );
    console.log(`[ingest] Quality report: ${QUALITY_REPORT_PATH}`);
  } finally {
    con.closeSync();
    instance.closeSync();
  }
}

main().catch((err) => {
  console.error('[ingest] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
