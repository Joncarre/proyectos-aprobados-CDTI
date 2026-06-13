# API de consulta (solo lectura)

Base: `http://localhost:3001` (configurable vía `.env`). Todos los endpoints son `GET` y
devuelven JSON. No existe ningún endpoint de escritura: la base de datos se abre en modo
`READ_ONLY` y solo la ingesta CLI la modifica.

## Filtros globales

**Todos** los endpoints de `/api/*` (salvo `/api/meta`) aceptan el mismo conjunto de filtros
combinables como query params. Los filtros multivalor se repiten:
`?ccaa=Cataluña&ccaa=La Rioja`.

| Param                               | Tipo                | Descripción                                                                        |
| ----------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `anios`                             | int, repetible      | Años de aprobación (2000–2100)                                                     |
| `meses`                             | int 1–12, repetible | Meses (el atajo de trimestre T1 → `meses=1&meses=2&meses=3` lo aplica el frontend) |
| `presupuestoMin` / `presupuestoMax` | número ≥ 0          | Rango de presupuesto (€)                                                           |
| `aportacionMin` / `aportacionMax`   | número ≥ 0          | Rango de aportación CDTI (€)                                                       |
| `pctMin` / `pctMax`                 | número 0–100        | Rango de % de aportación                                                           |
| `ccaa`                              | string, repetible   | Comunidades autónomas (lista blanca)                                               |
| `provincias`                        | string, repetible   | Provincias (lista blanca)                                                          |
| `instrumentos`                      | string, repetible   | Instrumentos financieros (lista blanca)                                            |
| `areas`                             | string, repetible   | Áreas sectoriales (lista blanca)                                                   |
| `origenes`                          | string, repetible   | Orígenes de fondos (lista blanca)                                                  |
| `tiposAyuda`                        | string, repetible   | Tipos de ayuda (lista blanca)                                                      |
| `pyme`                              | `si` \| `no`        | Tri-estado: ausente = todas                                                        |
| `q`                                 | string 2–120        | Búsqueda libre en título y razón social (sin distinción de mayúsculas/tildes)      |
| `nif`                               | string              | NIF exacto de una empresa                                                          |

Los valores categóricos se validan contra **listas blancas** cargadas de la base de datos al
arrancar; un valor desconocido produce `400` indicando el parámetro y el valor rechazado.
Las consultas SQL son siempre **parametrizadas**: ningún input del usuario se interpola.

## Endpoints

| Endpoint                   | Params propios                                                                                                                    | Devuelve                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /health`              | —                                                                                                                                 | `{ status: 'ok' }`                                                                                        |
| `GET /api/meta`            | —                                                                                                                                 | Opciones de filtros (con provincias por CCAA), rangos para sliders, metadatos de ingesta                  |
| `GET /api/projects`        | `page` (≥1), `pageSize` (1–100), `sort` (`fecha`\|`presupuesto`\|`aportacion`\|`pct`\|`empresa`\|`anio`), `order` (`asc`\|`desc`) | Lista paginada + agregados (nº, empresas, sumas, % medio, % PYME)                                         |
| `GET /api/stats`           | —                                                                                                                                 | Solo los agregados (KPIs de cabecera)                                                                     |
| `GET /api/kpi-trends`      | —                                                                                                                                 | Cada KPI agregado por año (sparklines y deltas de la cabecera)                                            |
| `GET /api/timeseries`      | `granularidad` (`anio`\|`mes`), `agrupar` (`ccaa`\|`area`\|`instrumento`\|`origen`, opcional)                                     | Serie temporal de las 4 métricas, opcionalmente desglosada para superponer grupos                         |
| `GET /api/geo`             | `nivel` (`ccaa`\|`provincia`)                                                                                                     | Métricas por región para el mapa coroplético                                                              |
| `GET /api/heatmap`         | `dim` (`area`\|`ccaa`)                                                                                                            | Celdas año × categoría con las 4 métricas                                                                 |
| `GET /api/rankings`        | `por` (`instrumento`\|`area`\|`origen`\|`tipoAyuda`\|`ccaa`), `limit` (1–100)                                                     | Top categorías ordenadas por aportación                                                                   |
| `GET /api/distribution`    | `desglose` (`ninguno`\|`tipoAyuda`\|`instrumento`)                                                                                | Histograma del % de aportación en bins de 5; desglosado, una serie por categoría (instrumento: top 6)     |
| `GET /api/cohorts`         | —                                                                                                                                 | Por año, empresas nuevas (primera ayuda del histórico) vs recurrentes                                     |
| `GET /api/seasonality`     | —                                                                                                                                 | Aprobaciones por mes natural (1–12), agregadas sobre todos los años                                       |
| `GET /api/pyme-comparison` | —                                                                                                                                 | Métricas de PYME vs no-PYME (nº, importes, ticket medio, % medio)                                         |
| `GET /api/companies`       | `minProyectos` (≥1), `limit` (1–200), `ordenar` (`proyectos`\|`aportacion`)                                                       | Empresas recurrentes agregadas por NIF dentro del conjunto filtrado                                       |
| `GET /api/treemap`         | —                                                                                                                                 | Desglose área sectorial → instrumento (aportación y nº de proyectos)                                      |
| `GET /api/projects/export` | `fmt` (`csv`\|`json`\|`xml`\|`toon`)                                                                                              | Descarga del conjunto filtrado (CSV con `;` + BOM UTF-8; JSON; XML; o TOON, tabular y compacto para LLMs) |

Los tipos exactos de las respuestas viven en [`shared/src/api.ts`](../shared/src/api.ts) y los
esquemas de los parámetros en [`shared/src/filters.ts`](../shared/src/filters.ts) — el frontend
consume ambos directamente.

## Ejemplo: caso de uso de referencia

_Proyectos del T1 de 2020 en la Comunidad de Madrid en Tecnologías Informáticas, con el
porcentaje medio de aportación del CDTI:_

```
GET /api/projects?anios=2020&meses=1&meses=2&meses=3
    &ccaa=Comunidad de Madrid&areas=Tecnologías Informáticas
```

```json
{
  "items": [ ... ],
  "total": 21,
  "aggregates": {
    "proyectos": 21,
    "empresas": 20,
    "presupuestoTotal": 9752251,
    "aportacionTotal": 7160451.87,
    "pctMedio": 75.2,
    "pctPymes": 61.9
  }
}
```

Latencia medida en servidor (Fastify `responseTime`): mediana 6 ms, máximo 58 ms con filtros
complejos (3 años + 2 CCAA + PYME + rango % + rango presupuesto + búsqueda libre + ordenación).

## Errores

| Código | Causa                                                                  | Cuerpo                                             |
| ------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `400`  | Parámetro inválido o valor fuera de lista blanca                       | `{ error, details: [{ param, message }] }`         |
| `404`  | Ruta inexistente                                                       | `{ message, error, statusCode }` (formato Fastify) |
| `429`  | Rate limit superado (300 req/min/IP por defecto)                       | formato Fastify                                    |
| `500`  | Error interno (se registra en el log; no se filtra detalle al cliente) | `{ error: "Error interno" }`                       |

## Seguridad

- Cabeceras vía `@fastify/helmet`; CORS restringido a `CORS_ORIGIN` y método `GET`.
- Rate limiting con `@fastify/rate-limit` (`RATE_LIMIT_MAX`, por defecto 300/min/IP).
- Validación estricta con zod + listas blancas de BD; SQL 100 % parametrizado.
- Punto de extensión de autenticación preparado y desactivado (`AUTH_ENABLED=false`):
  hook `onRequest` en `backend/src/server.ts`.
