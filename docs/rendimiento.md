# Rendimiento

> Objetivo de diseño: que recalcular el dashboard al cambiar un filtro se sienta
> instantáneo (< 200 ms percibidos). Para la arquitectura, ver
> [arquitectura.md](./arquitectura.md).

## Backend

- **DuckDB columnar en `READ_ONLY`**, ideal para agregaciones analíticas sobre
  ~20.000 filas: cada endpoint devuelve **datos ya agregados** en SQL, nunca
  vuelca filas crudas salvo en la tabla paginada y la exportación.
- **Pool de conexiones** round-robin ([`db.ts`](../backend/src/db.ts)): varias
  conexiones nativas atienden peticiones concurrentes sin contención.
- **SQL parametrizado y mínimo**: una sola `WHERE` compartida
  ([`where.ts`](../backend/src/where.ts)) traduce los filtros validados; el motor
  reaprovecha el plan entre llamadas.

## Frontend

- **TanStack Query con `placeholderData` (keepPreviousData)**: al refiltrar, la
  vista anterior permanece en pantalla y solo se atenúa (`isPlaceholderData`),
  evitando parpadeos y saltos de layout.
- **Memoización**: cada `option` de ECharts se construye dentro de `useMemo`, de
  modo que un re-render que no cambia datos no recalcula la configuración.
- **Carga diferida del Dashboard**: el panel de filtros y la cabecera se pintan
  de inmediato; ECharts y el atlas geográfico se importan de forma `lazy` y se
  calientan **detrás del splash** de primera visita.
- **Bundle troceado** ([`vite.config.ts`](../frontend/vite.config.ts)): el
  `manualChunks` aísla ECharts (~704 kB) y el atlas (~99 kB) en chunks **async**
  cacheables que no bloquean el primer pintado, y agrupa el resto de
  dependencias en un `vendor` cacheable. La entrada de la app baja de ~535 kB a
  ~32 kB.
- **ECharts _tree-shaken_** ([`lib/echarts.ts`](../frontend/src/lib/echarts.ts)):
  solo se registran los charts y componentes realmente usados.
- **Tabla paginada en servidor** (25/50/100): el DOM queda acotado a una página,
  lo que hace innecesaria la virtualización.
- **Transiciones por _merge_**: el coroplético tween-ea colores reusando la serie
  (`mergeSeries`) en lugar de recrearla.

## Cómo medirlo

- **Red**: en DevTools → Network, el coste de cambiar un filtro es una llamada
  agregada por panel visible; observar el `Time` de cada `/api/*`.
- **Bundle**: `npm run build --workspace frontend` imprime el tamaño de cada
  chunk (gzip incluido).
- **Lighthouse**: ejecutar sobre la build servida (`vite preview`) para LCP/TBT.
