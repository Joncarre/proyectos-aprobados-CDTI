# Registro de decisiones técnicas

Decisiones estructurales del proyecto, en orden cronológico. Las decisiones de cada fase se
añaden aquí al cerrarla.

## FASE 0 (2026-06-12)

| # | Decisión | Alternativas consideradas | Motivo |
|---|---|---|---|
| 1 | **DuckDB** como base de datos | SQLite, PostgreSQL | Motor columnar vectorizado: agregaciones con filtros combinados sobre cientos de miles de filas en milisegundos. Embebido y sin operaciones. Modo `READ_ONLY` para la API; la ingesta es el único escritor y corre por CLI. Detalle completo en el README. |
| 2 | **Node + Fastify (TypeScript)** para backend e ingesta | Python + FastAPI | Un solo lenguaje en el monorepo; tipos compartidos backend/frontend en `shared/`; plugins oficiales de Fastify para CORS, helmet y rate-limit; cliente oficial DuckDB para Node. Confirmado por el usuario. |
| 3 | **npm workspaces** como monorepo | pnpm, turborepo, repos separados | Cero herramientas adicionales; un `npm install`; suficiente para 4 workspaces. |
| 4 | JSON crudos **fuera de git** (`data/raw/` gitignorado) | Versionarlos | Repo ligero; datos reproducibles copiando los ficheros. Confirmado por el usuario. |
| 5 | **ECharts** para gráficas, **MapLibre GL** para mapas | D3 puro, Leaflet | ECharts cubre series, heatmaps, treemap y sankey con animaciones de serie; D3 solo si hace falta algo a medida. MapLibre GL renderiza coropletas por WebGL con tooltips fluidos. Se revisará al llegar a la FASE 4. |
| 6 | TypeScript **5.x** en todos los workspaces | TypeScript 6 (recién publicado) | Compatibilidad garantizada con typescript-eslint 8; se migrará cuando el ecosistema lo soporte de forma estable. |
