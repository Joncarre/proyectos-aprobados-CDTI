# Modelo de datos (DuckDB)

Base de datos: `data/cdti.duckdb`, generada íntegramente por `npm run ingest` (idempotente:
cada ejecución la reconstruye desde cero a partir de `data/raw/*.json`). La API la abre en
modo `READ_ONLY`; la ingesta CLI es el único escritor.

## Tabla `projects` (principal)

Una fila por proyecto aprobado. Ordenada físicamente por `fecha_aprobacion` para que los
zone maps de DuckDB poden los filtros de fecha/año.

| Columna                 | Tipo          | Origen                                                                                    |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `id`                    | INTEGER       | Derivado: `row_number()` determinista (fecha, NIF, título)                                |
| `razon_social`          | VARCHAR       | `RazonSocial` (trim)                                                                      |
| `nif`                   | VARCHAR       | `NIFRazonSocial` normalizado: mayúsculas, solo alfanuméricos (`B-73102683` → `B73102683`) |
| `titulo`                | VARCHAR       | `TituloProyecto` (trim)                                                                   |
| `pyme`                  | BOOLEAN       | `PYME`: `S` → true, `N` → false, vacío → NULL                                             |
| `fecha_aprobacion`      | DATE          | `FechaAprobacionResolucion` (`DD/MM/YYYY`)                                                |
| `anio`                  | SMALLINT      | Derivado de la fecha                                                                      |
| `mes`                   | TINYINT       | Derivado de la fecha (1–12)                                                               |
| `trimestre`             | TINYINT       | Derivado de la fecha (1–4)                                                                |
| `tipo_entidad`          | VARCHAR       | `TipoEntidad`, canonizado\*                                                               |
| `ccaa`                  | VARCHAR       | `CCAA`, canonizado\*                                                                      |
| `provincia`             | VARCHAR       | `Provincia`, canonizado\*                                                                 |
| `localidad`             | VARCHAR       | `Localidad`, canonizado\*                                                                 |
| `codigo_postal`         | VARCHAR       | `CodigoPostal` (trim; 4 dígitos → relleno con cero inicial; vacío → NULL)                 |
| `tipo_ayuda`            | VARCHAR       | `TipoAyuda`, canonizado\*                                                                 |
| `instrumento`           | VARCHAR       | `InstrumentoFinanciero`, canonizado\* (vacío → NULL)                                      |
| `area_sectorial`        | VARCHAR       | `AreaSectorial`, canonizado\* (vacío → NULL)                                              |
| `cnae`                  | VARCHAR       | `CNAE`, canonizado\* (vacío → NULL)                                                       |
| `origen_fondos`         | VARCHAR       | `OrigenFondos`, canonizado\*                                                              |
| `presupuesto`           | DECIMAL(15,2) | `Presupuesto` («347.644,00 €» → 347644.00)                                                |
| `aportacion_cdti`       | DECIMAL(15,2) | `AportacionCDTI`, ídem                                                                    |
| `porcentaje_aportacion` | DECIMAL(5,2)  | Derivado: aportación / presupuesto × 100 (0–100). NULL si presupuesto es 0                |
| `ultima_actualizacion`  | DATE          | `UltimaFechaActualizacion`                                                                |
| `source_file`           | VARCHAR       | Fichero JSON de origen (p. ej. `2020.json`)                                               |

\* Canonizado = trim + colapso de espacios internos + sin puntos finales; variantes que solo
difieren en mayúsculas/tildes se unifican en la variante más frecuente. El mapa completo está
en `category_mappings`.

Índices ART: `anio`, `ccaa`, `provincia`, `instrumento`, `area_sectorial`, `origen_fondos`,
`nif`. En DuckDB el grueso del rendimiento analítico viene del escaneo columnar + zone maps;
los índices aceleran adicionalmente búsquedas selectivas.

## Tabla `raw_projects`

Copia exacta de los JSON de origen (todo VARCHAR, sin transformar) + `source_file`.
Garantiza trazabilidad total: cualquier valor original sigue siendo consultable.

## Tabla `category_mappings`

`(column_name, original_value, clean_value, occurrences)` — el mapa «valor original → valor
limpio» aplicado en la ingesta, consultable y auditable.

## Tabla `ingest_meta`

Una fila: `ingested_at`, `n_projects`, `n_source_files`, `n_companies`.

## Vistas

| Vista                                                                                                                               | Contenido                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `dim_anios`, `dim_ccaa`, `dim_instrumentos`, `dim_areas_sectoriales`, `dim_origenes_fondos`, `dim_tipos_ayuda`, `dim_tipos_entidad` | Valores distintos para poblar filtros y validar listas blancas en la API                   |
| `dim_provincias`                                                                                                                    | `(ccaa, provincia)` — alimenta el filtro de provincia dependiente de CCAA                  |
| `companies`                                                                                                                         | Agregado por NIF: razón social modal, nº de proyectos, totales, % medio, primer/último año |

## Decisiones de datos relevantes

- El único «duplicado lógico» (mismo NIF + título + fecha, 2 filas en 2014) tiene importes
  distintos: son tramos del mismo proyecto y **se conservan ambas filas**.
- 56 registros tienen presupuesto y aportación a 0 (placeholders del origen). Se conservan;
  su `porcentaje_aportacion` es NULL y no afecta a las medias.
- Informe de calidad completo: [data-quality.md](./data-quality.md) (regenerado en cada ingesta).
