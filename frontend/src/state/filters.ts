import { create } from 'zustand';
import type { ProjectFilters } from '@cdti/shared';

export type NumberArrayKey = 'anios' | 'meses';
export type StringArrayKey =
  | 'ccaa'
  | 'provincias'
  | 'instrumentos'
  | 'areas'
  | 'origenes'
  | 'tiposAyuda';
export type ArrayKey = NumberArrayKey | StringArrayKey;
export type MinMaxPair =
  | ['presupuestoMin', 'presupuestoMax']
  | ['aportacionMin', 'aportacionMax']
  | ['pctMin', 'pctMax'];

interface FiltersStore {
  filters: ProjectFilters;
  toggleValue: (key: ArrayKey, value: string | number) => void;
  setArray: (key: ArrayKey, values: ReadonlyArray<string | number>) => void;
  setRange: (pair: MinMaxPair, range: [number | undefined, number | undefined]) => void;
  setPyme: (value: 'si' | 'no' | undefined) => void;
  setQ: (value: string | undefined) => void;
  /** Drops selected provinces that no longer belong to an active CCAA. */
  pruneProvincias: (allowed: ReadonlySet<string>) => void;
  clearKey: (key: keyof ProjectFilters) => void;
  clearAll: () => void;
  replaceAll: (filters: ProjectFilters) => void;
}

const emptyToUndefined = <T>(values: T[]): T[] | undefined =>
  values.length > 0 ? values : undefined;

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: {},

  toggleValue: (key, value) =>
    set((state) => {
      const current = (state.filters[key] ?? []) as Array<string | number>;
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { filters: { ...state.filters, [key]: emptyToUndefined(next) } };
    }),

  setArray: (key, values) =>
    set((state) => ({
      filters: { ...state.filters, [key]: emptyToUndefined([...values]) },
    })),

  setRange: ([minKey, maxKey], [min, max]) =>
    set((state) => ({
      filters: { ...state.filters, [minKey]: min, [maxKey]: max },
    })),

  setPyme: (value) => set((state) => ({ filters: { ...state.filters, pyme: value } })),

  setQ: (value) =>
    set((state) => ({
      filters: { ...state.filters, q: value === '' ? undefined : value },
    })),

  pruneProvincias: (allowed) =>
    set((state) => {
      const current = state.filters.provincias;
      if (!current) return state;
      const next = current.filter((p) => allowed.has(p));
      if (next.length === current.length) return state;
      return { filters: { ...state.filters, provincias: emptyToUndefined(next) } };
    }),

  clearKey: (key) => set((state) => ({ filters: { ...state.filters, [key]: undefined } })),

  clearAll: () => set({ filters: {} }),

  replaceAll: (filters) => set({ filters }),
}));

/** Number of active filter groups (a min/max pair counts as one). */
export function countActiveFilters(filters: ProjectFilters): number {
  let count = 0;
  if (filters.anios?.length) count++;
  if (filters.meses?.length) count++;
  if (filters.presupuestoMin !== undefined || filters.presupuestoMax !== undefined) count++;
  if (filters.aportacionMin !== undefined || filters.aportacionMax !== undefined) count++;
  if (filters.pctMin !== undefined || filters.pctMax !== undefined) count++;
  if (filters.ccaa?.length) count++;
  if (filters.provincias?.length) count++;
  if (filters.instrumentos?.length) count++;
  if (filters.areas?.length) count++;
  if (filters.origenes?.length) count++;
  if (filters.tiposAyuda?.length) count++;
  if (filters.pyme !== undefined) count++;
  if (filters.q !== undefined) count++;
  if (filters.nif !== undefined) count++;
  return count;
}
