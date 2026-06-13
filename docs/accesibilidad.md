# Accesibilidad

> Nivel AA básico, prioridad escritorio pero usable en tablet. Para el sistema de
> diseño, ver [design-system.md](./design-system.md).

## Estructura semántica

- `lang="es"` en el documento; landmarks `header` / `aside` / `main`.
- Jerarquía de encabezados: `h2` (Filtros) y `h3` por sección de filtros y por
  tarjeta de panel.
- La tabla de detalle usa `caption` (oculto visualmente), `scope="col"` y
  `aria-sort` en las cabeceras ordenables.

## Teclado

- Los componentes interactivos no triviales se apoyan en **Radix UI** (Popover,
  Checkbox), navegables y operables por teclado de serie (Tab, flechas, Esc,
  Espacio), con gestión de foco y cierre con Escape.
- Todos los controles propios son `<button>`/`<input>`/`<select>` nativos: el tab
  de colapsar filtros, la paginación, el orden de columnas y los chips de filtro.
- **Anillo de foco** visible y consistente en toda la app (`:focus-visible` con
  el color de acento), definido en [`index.css`](../frontend/src/index.css).

## ARIA

- `aria-label` en botones de solo icono (paginación, colapsar panel, quitar
  chip) y en los disparadores de filtro, incluyendo el recuento de selección.
- `aria-sort` + `aria-label` («Ordenar por …») en las cabeceras de la tabla.
- `aria-expanded` en los conmutadores de panel; `aria-busy` en los esqueletos de
  carga; `aria-hidden` en el panel cuando está colapsado.

## Contraste

El texto **funcional** (datos, etiquetas, botones: tokens `ink`, `ink-soft`,
`ink-strong` y `accent`) cumple AA (≥ 4.5:1) sobre las superficies claras. El
token `ink-faint` se reserva a **pistas no esenciales** (placeholders, sufijos
«vs 2024», ayudas de exportación).

## Limitaciones conocidas

- Los **gráficos** (lienzo de ECharts) no son leídos por lectores de pantalla.
  Los mismos datos están disponibles de forma accesible en la **tabla** y en la
  **exportación** (CSV/JSON/XML/TOON), y cada panel lleva título y subtítulo.
- Mejora futura: honrar `prefers-reduced-motion` también en las animaciones de
  entrada gestionadas por Motion (hoy son suaves y breves).
