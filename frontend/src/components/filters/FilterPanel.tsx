import { useEffect, useMemo, type ReactNode } from 'react';
import type { MetaResponse } from '@cdti/shared';
import { useMeta } from '../../api/queries';
import { countActiveFilters, useFiltersStore } from '../../state/filters';
import { Skeleton } from '../ui/Skeleton';
import { MultiSelectFilter, type OptionGroup } from './MultiSelectFilter';
import { MonthFilter } from './MonthFilter';
import { PymeFilter } from './PymeFilter';
import { RangeFilter } from './RangeFilter';
import { TextSearch } from './TextSearch';
import { YearFilter } from './YearFilter';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[0.65rem] font-semibold tracking-wider text-ink-faint uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

const flat = (options: string[]): OptionGroup[] => [{ label: null, options }];

export function FilterPanel() {
  const { data: meta } = useMeta();
  const filters = useFiltersStore((state) => state.filters);
  const toggleValue = useFiltersStore((state) => state.toggleValue);
  const clearKey = useFiltersStore((state) => state.clearKey);
  const clearAll = useFiltersStore((state) => state.clearAll);
  const pruneProvincias = useFiltersStore((state) => state.pruneProvincias);

  const activeCount = countActiveFilters(filters);
  const provinceGroups = useMemo(
    () => buildProvinceGroups(meta, filters.ccaa),
    [meta, filters.ccaa],
  );

  // Dependent filter: deselect provinces that left the allowed set when CCAA changes
  useEffect(() => {
    if (!meta || !filters.ccaa?.length) return;
    const allowed = new Set(provinceGroups.flatMap((group) => group.options));
    pruneProvincias(allowed);
  }, [meta, filters.ccaa, provinceGroups, pruneProvincias]);

  if (!meta) return <PanelSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-strong">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <TextSearch />

      <Section title="Periodo">
        <YearFilter anios={meta.options.anios} />
        <MonthFilter />
      </Section>

      <Section title="Importes">
        <RangeFilter
          pair={['presupuestoMin', 'presupuestoMax']}
          max={meta.rangos.presupuesto.max}
          scale="log"
          unit="money"
          label="Presupuesto"
        />
        <RangeFilter
          pair={['aportacionMin', 'aportacionMax']}
          max={meta.rangos.aportacion.max}
          scale="log"
          unit="money"
          label="Aportación CDTI"
        />
        <RangeFilter
          pair={['pctMin', 'pctMax']}
          max={100}
          scale="linear"
          unit="pct"
          label="% de aportación CDTI"
        />
      </Section>

      <Section title="Territorio">
        <MultiSelectFilter
          label="Comunidad autónoma"
          groups={flat(meta.options.ccaa)}
          selected={filters.ccaa ?? []}
          onToggle={(value) => toggleValue('ccaa', value)}
          onClear={() => clearKey('ccaa')}
        />
        <MultiSelectFilter
          label="Provincia"
          groups={provinceGroups}
          selected={filters.provincias ?? []}
          onToggle={(value) => toggleValue('provincias', value)}
          onClear={() => clearKey('provincias')}
          searchable
        />
      </Section>

      <Section title="Clasificación">
        <MultiSelectFilter
          label="Instrumento financiero"
          groups={flat(meta.options.instrumentos)}
          selected={filters.instrumentos ?? []}
          onToggle={(value) => toggleValue('instrumentos', value)}
          onClear={() => clearKey('instrumentos')}
          searchable
        />
        <MultiSelectFilter
          label="Área sectorial"
          groups={flat(meta.options.areas)}
          selected={filters.areas ?? []}
          onToggle={(value) => toggleValue('areas', value)}
          onClear={() => clearKey('areas')}
          searchable
        />
        <MultiSelectFilter
          label="Origen de fondos"
          groups={flat(meta.options.origenes)}
          selected={filters.origenes ?? []}
          onToggle={(value) => toggleValue('origenes', value)}
          onClear={() => clearKey('origenes')}
        />
        <MultiSelectFilter
          label="Tipo de ayuda"
          groups={flat(meta.options.tiposAyuda)}
          selected={filters.tiposAyuda ?? []}
          onToggle={(value) => toggleValue('tiposAyuda', value)}
          onClear={() => clearKey('tiposAyuda')}
        />
      </Section>

      <Section title="Empresa">
        <PymeFilter />
      </Section>
    </div>
  );
}

function buildProvinceGroups(
  meta: MetaResponse | undefined,
  activeCcaa: string[] | undefined,
): OptionGroup[] {
  if (!meta) return [];
  const visible = activeCcaa?.length
    ? meta.options.provincias.filter((entry) => activeCcaa.includes(entry.ccaa))
    : meta.options.provincias;

  const byCcaa = new Map<string, string[]>();
  for (const entry of visible) {
    const list = byCcaa.get(entry.ccaa) ?? [];
    list.push(entry.provincia);
    byCcaa.set(entry.ccaa, list);
  }
  const groups = [...byCcaa.entries()].map(([ccaa, provincias]) => ({
    label: ccaa,
    options: provincias,
  }));
  return groups.length === 1 ? [{ label: null, options: groups[0]!.options }] : groups;
}

function PanelSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando filtros">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
