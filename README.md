# Proyectos CDTI — Plataforma de visualización de datos

Aplicación web interna para **consultar, filtrar, cruzar y extraer estadísticas** de los proyectos
aprobados por el CDTI (Centro para el Desarrollo Tecnológico y la Innovación). Pensada para
empleados del CDTI que necesitan respuestas rápidas y visuales sobre ~20.000 proyectos (2014–2026)
de más de 10.000 empresas.

Principios rectores, en orden: **rendimiento** (filtros con respuesta < 200 ms percibidos),
**arquitectura limpia y sencilla**, y **diseño UX/UI de nivel premium**.

---

## Arquitectura

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
  salvo en la tabla paginada. Parámetros validados contra listas blancas; SQL siempre
  parametrizado; CORS restringido, cabeceras de seguridad y rate limiting.
- **`frontend/`** — SPA React 19 + TypeScript + Vite + Tailwind 4. Estado de filtros global
  ligero (Zustand) sincronizado con la URL para que cualquier vista sea compartible por enlace.
  Visualización: ECharts (gráficas, heatmaps), MapLibre GL + GeoJSON oficial (mapas
  coropléticos de CCAA/provincias), Framer Motion (transiciones).
- **`shared/`** — contratos TypeScript compartidos entre backend y frontend (tipos de filtros,
  DTOs de la API, enums de categorías). Una sola fuente de verdad para los tipos.
- **`data/`** — los JSON crudos (en `data/raw/`, fuera de git) y la base `cdti.duckdb`
  generada por la ingesta (también fuera de git).
- **`docs/`** — documentación: [decisiones](docs/decisions.md), [modelo de datos](docs/database.md),
  [API](docs/api.md), [sistema de diseño](docs/design-system.md),
  [informe de calidad de datos](docs/data-quality.md) (regenerado en cada ingesta).

## Decisiones técnicas

### Base de datos: DuckDB

Se evaluaron tres opciones para la prioridad nº 1 (consultas analíticas con filtros combinados
sobre cientos de miles de filas, en < 200 ms):

| Opción        | Veredicto                                                                                                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DuckDB** ✅ | Motor **columnar y vectorizado**, diseñado exactamente para este patrón: `GROUP BY` y agregaciones sobre cientos de miles de filas en milisegundos sin afinado. Embebido (cero operaciones, un solo fichero), con modo `READ_ONLY` que permite múltiples lectores concurrentes — encaja con una API de solo lectura cuya ingesta corre aparte por CLI. |
| SQLite        | Orientado a filas (OLTP). Los índices aceleran búsquedas puntuales, pero las agregaciones con filtros combinados degeneran en escaneos de tabla notablemente más lentos que un motor columnar. Descartado para carga analítica.                                                                                                                        |
| PostgreSQL    | Excelente si hubiera escrituras concurrentes o despliegue multiusuario con necesidades transaccionales. Aquí solo añade coste operativo (servidor, credenciales, despliegue). El SQL es estándar: migrar más adelante sigue siendo viable si el despliegue lo exige.                                                                                   |

### Backend: Node + Fastify (TypeScript)

Frente a Python/FastAPI: **un solo lenguaje en todo el monorepo**. Los tipos de filtros y DTOs
viven en `shared/` y los consumen backend y frontend — imposible que diverjan. Un único
toolchain (npm), cliente oficial de DuckDB para Node (`@duckdb/node-api`) y plugins de primera
parte para los requisitos de seguridad (`@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`).

### Otras decisiones

- **Monorepo con npm workspaces** — un `npm install` en la raíz instala todo; sin herramientas
  extra de monorepo (sin sobre-ingeniería).
- **ESLint 9 (flat config) + Prettier** compartidos en la raíz; TypeScript `strict` en todos los
  workspaces vía `tsconfig.base.json`.
- **Sin secretos en el repo**: configuración por `.env` (con `.env.example` versionado);
  lockfile (`package-lock.json`) versionado para fijar dependencias.
- La autenticación queda **prevista pero desactivada**: el backend dejará un punto de extensión
  (hook de Fastify) para incorporarla si se despliega para el CDTI.

## Estructura del repositorio

```
├── ingest/          # Pipeline de ingesta (CLI) — FASE 1
├── backend/         # API de solo lectura (Fastify + DuckDB) — FASE 2
├── frontend/        # SPA (React + Vite + Tailwind) — FASES 3–4
├── shared/          # Tipos y contratos compartidos
├── data/
│   └── raw/         # ← copiar aquí los 13 JSON (gitignorado)
├── docs/            # Documentación del proyecto
├── .env.example     # Plantilla de configuración (copiar a .env)
└── package.json     # Raíz del monorepo (npm workspaces)
```

## Puesta en marcha

Requisitos: **Node.js ≥ 22** (npm incluido).

```bash
# 1. Instalar todas las dependencias (todos los workspaces)
npm install

# 2. Configuración
#    Copia .env.example a .env (los valores por defecto sirven en desarrollo)
#    Copia frontend/.env.example a frontend/.env

# 3. Datos: copia los 13 ficheros JSON en data/raw/

# 4. Ingesta (FASE 1): genera data/cdti.duckdb
npm run ingest

# 5. Arrancar la API (http://localhost:3001)
npm run dev:api

# 6. Arrancar el frontend (http://localhost:5173) en otra terminal
npm run dev:web
```

### Scripts disponibles (raíz)

| Script                            | Descripción                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `npm run ingest`                  | Ejecuta el pipeline de ingesta (CLI, única vía de escritura en la BD) |
| `npm run dev:api`                 | API en modo desarrollo con recarga (`tsx watch`)                      |
| `npm run dev:web`                 | Frontend en modo desarrollo (Vite)                                    |
| `npm run build`                   | Build de producción de todos los workspaces                           |
| `npm run typecheck`               | Comprobación de tipos en todos los workspaces                         |
| `npm run lint` / `lint:fix`       | ESLint sobre todo el repo                                             |
| `npm run format` / `format:check` | Prettier sobre todo el repo                                           |

## Estado del proyecto

| Fase       | Contenido                           | Estado |
| ---------- | ----------------------------------- | ------ |
| **FASE 0** | Arquitectura, esqueleto, tooling    | ✅     |
| **FASE 1** | Ingesta y base de datos             | ✅     |
| **FASE 2** | API de consulta                     | ✅     |
| **FASE 3** | Layout, sistema de diseño y filtros | ✅     |
| FASE 4     | Visualizaciones                     | ⏳     |
| FASE 5     | Pulido, rendimiento y seguridad     | ⏳     |
