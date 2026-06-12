# Arquitectura y decisiones técnicas

> Documento técnico. Para el manual de uso, ver el [README](../README.md).

## Visión general

```
13 JSON crudos          CLI (solo local)           API solo lectura          SPA
┌─────────────┐   ┌──────────────────────┐   ┌────────────────────┐   ┌──────────────────┐
│  data/raw/  │ → │  ingest/             │ → │  backend/          │ → │  frontend/       │
│  *.json     │   │  normaliza, deriva,  │   │  Fastify + DuckDB  │   │  React + Vite +  │
│             │   │  carga en DuckDB     │   │  (READ_ONLY)       │   │  Tailwind        │
└─────────────┘   └──────────┬───────────┘   └─────────┬──────────┘   └──────────────────┘
                             ▼                         │
                      data/cdti.duckdb  ◄──────────────┘
```

- **`ingest/`** — pipeline CLI idempotente: lee los JSON, normaliza importes (formato español
  → numérico), fechas (`DD/MM/YYYY` → fecha + año/mes/trimestre derivados), booleanos
  (`S`/`N`), limpia categorías inconsistentes y calcula `porcentaje_aportacion`
  (AportaciónCDTI / Presupuesto). Genera un informe de calidad de datos. **Toda** la
  información original se persiste, también los campos aún sin uso en la UI.
- **`backend/`** — API Fastify de **solo lectura** que abre DuckDB en modo `READ_ONLY`.
  Recibe filtros validados y devuelve agregaciones ya calculadas; nunca vuelca filas crudas
  salvo en la tabla paginada y la exportación. Parámetros validados contra listas blancas;
  SQL siempre parametrizado; CORS restringido, cabeceras de seguridad y rate limiting.
- **`frontend/`** — SPA React 19 + TypeScript + Vite + Tailwind 4. Estado de filtros global
  ligero (Zustand) sincronizado con la URL. Visualización: ECharts (gráficas, heatmaps, mapa
  coroplético con atlas es-atlas/IGN), Motion (transiciones).
- **`shared/`** — contratos TypeScript compartidos entre backend y frontend (esquemas zod de
  filtros, DTOs de la API). Una sola fuente de verdad para los tipos.
- **`data/`** — los JSON crudos (en `data/raw/`, fuera de git) y la base `cdti.duckdb`
  generada por la ingesta (también fuera de git).

## Base de datos: DuckDB

Se evaluaron tres opciones para la prioridad nº 1 (consultas analíticas con filtros combinados
en < 200 ms):

| Opción        | Veredicto                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DuckDB** ✅ | Motor **columnar y vectorizado**, diseñado exactamente para este patrón: `GROUP BY` y agregaciones sobre decenas o cientos de miles de filas en milisegundos sin afinado. Embebido (cero operaciones, un solo fichero), con modo `READ_ONLY` que permite múltiples lectores concurrentes — encaja con una API de solo lectura cuya ingesta corre aparte por CLI. |
| SQLite        | Orientado a filas (OLTP). Los índices aceleran búsquedas puntuales, pero las agregaciones con filtros combinados degeneran en escaneos notablemente más lentos que un motor columnar.                                                                                                                                                                            |
| PostgreSQL    | Excelente con escrituras concurrentes o despliegue multiusuario transaccional. Aquí solo añade coste operativo; migrar después sigue siendo viable (SQL estándar).                                                                                                                                                                                               |

Rendimiento medido: consulta de referencia con 6 filtros combinados → **1,7 ms** en DuckDB;
latencia de la API (mediana / máx con filtros complejos): **6 / 58 ms**.

## Backend: Node + Fastify (TypeScript)

Frente a Python/FastAPI: **un solo lenguaje en todo el monorepo**. Los esquemas de filtros y
DTOs viven en `shared/` y los consumen backend y frontend — imposible que diverjan. Plugins
de primera parte para seguridad (`@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`)
y cliente oficial de DuckDB para Node (`@duckdb/node-api`).

## Estructura del repositorio

```
├── ingest/          # Pipeline de ingesta (CLI)
├── backend/         # API de solo lectura (Fastify + DuckDB)
├── frontend/        # SPA (React + Vite + Tailwind)
├── shared/          # Tipos y contratos compartidos
├── data/
│   └── raw/         # ← copiar aquí los 13 JSON (gitignorado)
├── docs/            # Documentación
├── .env.example     # Plantilla de configuración (copiar a .env)
└── package.json     # Raíz del monorepo (npm workspaces)
```

## Scripts (raíz)

| Script                            | Descripción                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run ingest`                  | Ejecuta el pipeline de ingesta (única vía de escritura en la BD) |
| `npm run dev:api`                 | API en modo desarrollo con recarga (`tsx watch`)                 |
| `npm run dev:web`                 | Frontend en modo desarrollo (Vite)                               |
| `npm run build`                   | Build de producción de todos los workspaces                      |
| `npm run typecheck`               | Comprobación de tipos en todos los workspaces                    |
| `npm run lint` / `lint:fix`       | ESLint sobre todo el repo                                        |
| `npm run format` / `format:check` | Prettier sobre todo el repo                                      |

## Más documentación

- [Registro de decisiones](./decisions.md) — todas las decisiones numeradas por fase.
- [Modelo de datos](./database.md) — tablas, vistas y normalizaciones de la BD.
- [API](./api.md) — endpoints, filtros y formatos de error.
- [Sistema de diseño](./design-system.md) — tokens, tipografía y patrones de interacción.
- [Informe de calidad de datos](./data-quality.md) — regenerado en cada ingesta.
