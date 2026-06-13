# Proyectos CDTI — Explorador de datos

Aplicación web para **explorar los proyectos de I+D+i aprobados por el CDTI** (Centro para el
Desarrollo Tecnológico y la Innovación): ~20.000 proyectos entre 2014 y 2026, de más de
10.000 empresas. Permite filtrar, cruzar, visualizar y exportar la información de forma
rápida y visual, sin necesidad de conocimientos técnicos.

## Puesta en marcha

Requisitos: [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install              # 1. instalar dependencias
# 2. copiar los 13 ficheros JSON en data/raw/
npm run ingest           # 3. construir la base de datos
npm run dev:api          # 4. arrancar la API        (terminal 1)
npm run dev:web          # 5. arrancar la web        (terminal 2)
```

Abre **http://localhost:5173** y listo. Los detalles técnicos (arquitectura, API, modelo de
datos) están en [docs/arquitectura.md](docs/arquitectura.md).

## Cómo se usa

### Los filtros

El panel izquierdo (se puede ocultar con la pestaña del borde izquierdo) concentra todos los
filtros, **combinables entre sí**: periodo (años con barra deslizante, meses con atajos por
trimestre T1–T4), rangos de presupuesto, de aportación CDTI y de % de aportación, comunidad
autónoma y provincia (la lista de provincias se adapta a las comunidades elegidas),
instrumento financiero, área sectorial, origen de fondos, tipo de ayuda, condición de PYME y
búsqueda libre por título o empresa (encuentra «HIDRÓGENO» aunque escribas «hidrogeno»).

Cada filtro activo aparece como una **etiqueta** sobre el panel principal: puedes quitarlos de
uno en uno con su ✕ o todos con «Limpiar todo». Los indicadores de cabecera (nº de proyectos,
presupuesto, aportación, % medio, % de PYMEs) se recalculan al instante con cada cambio.

**La URL guarda siempre los filtros activos**: copia el enlace del navegador y cualquier
persona verá exactamente la misma vista.

### Qué muestra cada panel

- **Indicadores de cabecera (KPIs)** — las cinco cifras de arriba: nº de proyectos (y empresas
  distintas), presupuesto total, aportación CDTI total, % medio de aportación y % de PYMEs.
  Resumen del conjunto que tengas filtrado en cada momento.
- **Mapa de España** — colorea comunidades por proyectos, aportación o % medio. Clic en una
  comunidad para bajar a sus provincias (aplica el filtro a toda la página); clic en una
  provincia para filtrar por ella. Las Canarias se muestran junto a la península (distancia
  no a escala).
- **Evolución temporal** — presupuesto frente a aportación CDTI, por años o por meses. Puedes
  desglosar la serie por CCAA, área, instrumento u origen para **comparar evoluciones**, en
  euros o en % medio de aportación.
- **Nuevos vs. recurrentes** — cada año, cuántas empresas reciben ayuda del CDTI por primera
  vez frente a las que repiten, con la tasa de renovación de la cartera.
- **Estacionalidad** — en qué meses se concentran las aprobaciones (hay un fuerte pico en
  diciembre y agosto casi vacío).
- **Heatmap** — intensidad por año × área sectorial (o año × CCAA): de un vistazo, qué
  sectores concentran la ayuda y cómo se mueve en el tiempo.
- **Ranking** — top de instrumentos, áreas, orígenes de fondos o tipos de ayuda.
- **Distribución del % de aportación** — curva del peso real de la ayuda CDTI en los proyectos,
  que se puede **desglosar por tipo de ayuda o instrumento** (explica por qué hay dos modas:
  las ayudas reembolsables rondan el 75-85 %, las subvenciones bastante menos).
- **PYME vs. no PYME** — reparto de proyectos y de dinero entre pequeñas y grandes empresas,
  con el ticket medio y el % medio de cada grupo.
- **Áreas → instrumentos** — treemap: clic en un área para ver con qué instrumentos se
  financia; vuelve con la miga de pan inferior.
- **Empresas recurrentes** — quiénes repiten más. Clic en una empresa para ver **solo sus
  proyectos** en toda la página; vuelve a hacer clic para soltarla.
- **Tabla de detalle** — todos los proyectos del filtro activo, ordenable y paginada.

### Exportar

El botón **Exportar** de la tabla descarga el conjunto filtrado completo (no solo la página
visible) en cuatro formatos: **CSV** (se abre directamente en Excel en español), **JSON**,
**XML** y **TOON** (un formato tabular muy compacto, pensado para pasar los datos a una IA
gastando muchos menos tokens).

## Preguntas que puedes responder en segundos

1. **«¿Qué % medio de aportación puso el CDTI en el primer trimestre de 2020 en Madrid, en
   Tecnologías Informáticas?»** — Años: 2020 · pulsa T1 · CCAA: Comunidad de Madrid · Área:
   Tecnologías Informáticas. El KPI «% medio de aportación» da la respuesta (75,2 %).
2. **«¿Crece o decae la ayuda a un sector?»** — En _Evolución temporal_, desglosa por «Área»
   y compara las líneas; cambia a «%» para ver si el porcentaje de apoyo también cambia.
3. **«¿Qué provincias andaluzas concentran la ayuda?»** — Clic en Andalucía en el mapa: el
   mapa baja a provincias y todo (KPIs, gráficas, tabla) se restringe a Andalucía.
4. **«¿Quién recibe las mayores ayudas individuales?»** — En la tabla, ordena por
   «Aportación» descendente.
5. **«¿Qué proyectos de hidrógeno han hecho las PYMEs?»** — Escribe «hidrogeno» en el
   buscador y pon el conmutador en «PYME». Exporta el resultado a CSV si lo necesitas.
6. **«¿Toda la trayectoria de una empresa concreta?»** — Búscala en _Empresas recurrentes_ y
   haz clic: verás sus proyectos, importes y evolución a lo largo de los años.

## Sobre los datos

Datos públicos de proyectos aprobados por el CDTI (2014–2026). En la ingesta se normalizan
importes, fechas y categorías; el detalle de esa limpieza y las métricas de calidad están en
[docs/data-quality.md](docs/data-quality.md). Los registros sin dato en algún campo (p. ej.
272 proyectos sin instrumento) se conservan y simplemente no aparecen al filtrar por ese
campo.

## Tecnologías

A grandes rasgos, la herramienta se apoya en estas piezas (el detalle y el porqué de cada
elección están en [docs/arquitectura.md](docs/arquitectura.md)):

- **Interfaz:** [React](https://react.dev) + TypeScript sobre [Vite](https://vite.dev), con
  estilos en [Tailwind CSS](https://tailwindcss.com). Las gráficas y el mapa usan
  [ECharts](https://echarts.apache.org); las animaciones, [Motion](https://motion.dev). El
  estado de los filtros se gestiona con [Zustand](https://zustand-demo.pmnd.rs) y la carga de
  datos con [TanStack Query](https://tanstack.com/query). Tipografías Inter (texto) y
  JetBrains Mono (cifras).
- **Mapa:** atlas oficial de España (comunidades y provincias) del IGN en formato TopoJSON.
- **Servidor / API:** [Node.js](https://nodejs.org) con [Fastify](https://fastify.dev) en
  TypeScript. Es una API de **solo lectura**.
- **Base de datos:** [DuckDB](https://duckdb.org), un motor analítico columnar y embebido (un
  solo fichero, sin servidor) que resuelve los filtros combinados en milisegundos.
- **Ingesta:** un script en TypeScript normaliza los JSON originales (importes, fechas,
  categorías) y los carga en DuckDB.
- **Calidad de código:** ESLint y Prettier; todo el proyecto es un monorepo con npm workspaces
  y tipos compartidos entre servidor e interfaz.

## Documentación técnica

| Documento                                      | Contenido                                 |
| ---------------------------------------------- | ----------------------------------------- |
| [docs/arquitectura.md](docs/arquitectura.md)   | Arquitectura, stack, estructura y scripts |
| [docs/api.md](docs/api.md)                     | Endpoints y filtros de la API             |
| [docs/database.md](docs/database.md)           | Modelo de datos (DuckDB)                  |
| [docs/design-system.md](docs/design-system.md) | Sistema de diseño                         |
| [docs/decisions.md](docs/decisions.md)         | Registro de decisiones técnicas           |

| Fase   | Contenido                             | Estado |
| ------ | ------------------------------------- | ------ |
| FASE 0 | Arquitectura, esqueleto, tooling      | ✅     |
| FASE 1 | Ingesta y base de datos               | ✅     |
| FASE 2 | API de consulta                       | ✅     |
| FASE 3 | Layout, sistema de diseño y filtros   | ✅     |
| FASE 4 | Visualizaciones (+ ajustes de diseño) | ✅     |
| FASE 5 | Pulido, rendimiento y seguridad       | ⏳     |
