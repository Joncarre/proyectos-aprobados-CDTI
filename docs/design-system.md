# Sistema de diseño

Paleta **clara** (decisión del usuario), sobria y con un único acento — inspiración: Linear,
Stripe, Vercel. Los tokens viven en [`frontend/src/index.css`](../frontend/src/index.css)
(Tailwind 4, configuración CSS-first con `@theme`) y usan **nombres semánticos**: los
componentes nunca referencian colores crudos, así que un futuro modo oscuro solo tiene que
remapear variables.

## Tokens

| Token                                                    | Valor                             | Uso                                        |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| `--color-page`                                           | `#f7f7f8`                         | Fondo de la aplicación                     |
| `--color-surface`                                        | `#ffffff`                         | Tarjetas, panel, popovers                  |
| `--color-surface-2`                                      | `#f4f4f5`                         | Hovers, superficies anidadas               |
| `--color-line` / `--color-line-strong`                   | `#e8e8ea` / `#d9d9dc`             | Bordes por defecto / interactivos          |
| `--color-ink` / `--color-ink-soft` / `--color-ink-faint` | `#1a1a1e` / `#55555e` / `#9b9ba3` | Texto primario / secundario / placeholders |
| `--color-accent` (+ `-strong`, `-soft`, `-line`)         | familia índigo `#4f46e5`          | Único acento: selecciones, chips, foco     |
| `--color-series-budget` / `--color-series-grant`         | `#94a3b8` / `#4f46e5`             | Series presupuesto vs aportación (FASE 4)  |
| `--shadow-card` / `--shadow-pop`                         | sombras en capas de baja opacidad | Tarjetas / popovers                        |

**Tipografía:** Inter Variable (autoalojada vía `@fontsource-variable/inter`). Títulos
`font-semibold tracking-tight`; todas las cifras con `tabular-nums` para que no bailen al
actualizarse. Tamaño base 14 px (densidad de herramienta interna).

**Foco:** anillo accent de 2 px con offset (`:focus-visible`), consistente en toda la app.

## Patrones de interacción

- **Skeletons, no spinners**: la carga inicial muestra skeletons con shimmer suave
  (`--animate-shimmer`); las actualizaciones por cambio de filtro conservan el dato anterior
  (`keepPreviousData` de TanStack Query) y atenúan la cifra (`opacity-50`) hasta que llega la
  nueva — sin saltos de layout.
- **Chips de filtros activos** con entrada/salida animadas (Motion, 150 ms) y «Limpiar todo».
- **Microinteracciones**: transiciones de color en todos los controles, escala 1.1 en los
  thumbs de los sliders, popovers con sombra `--shadow-pop`.
- **Controles**: multiselect con popover Radix (buscador opcional, listas agrupadas), grids de
  toggles para años/meses con atajos T1–T4, sliders de rango Radix (escala logarítmica en
  importes) + inputs numéricos exactos, segmented control para el tri-estado PYME.

## Inventario de componentes

| Capa                 | Componentes                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui`      | `Skeleton`, `Popover`, `Checkbox`, `RangeSlider`, `Segmented`                                                                   |
| `components/filters` | `FilterPanel`, `MultiSelectFilter`, `YearFilter`, `MonthFilter`, `RangeFilter`, `PymeFilter`, `TextSearch`, `ActiveFilterChips` |
| `components/layout`  | `Header`, `AppShell`                                                                                                            |
| `components/kpi`     | `KpiStrip`                                                                                                                      |

## Estado y URL

`state/filters.ts` (Zustand) es la única fuente de verdad de los filtros;
`state/urlSync.ts` la sincroniza con la query string en ambas direcciones
(`replaceState` + `popstate`), reutilizando el esquema zod de `@cdti/shared` para validar lo
que llega por URL. Cualquier vista es compartible copiando el enlace.
