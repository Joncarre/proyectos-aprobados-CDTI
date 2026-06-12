import { BarChart3, Grid3X3, LineChart, Map, Table2 } from 'lucide-react';
import { ActiveFilterChips } from '../filters/ActiveFilterChips';
import { FilterPanel } from '../filters/FilterPanel';
import { KpiStrip } from '../kpi/KpiStrip';
import { Header } from './Header';

const UPCOMING = [
  { icon: Map, label: 'Mapa por CCAA y provincias' },
  { icon: LineChart, label: 'Evolución temporal' },
  { icon: Grid3X3, label: 'Heatmap año × sector' },
  { icon: BarChart3, label: 'Rankings y distribución' },
  { icon: Table2, label: 'Tabla de detalle' },
] as const;

export function AppShell() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <aside
          aria-label="Panel de filtros"
          className="sticky top-14 h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-line bg-surface p-4"
        >
          <FilterPanel />
        </aside>

        <main className="min-w-0 flex-1 space-y-4 p-5">
          <ActiveFilterChips />
          <KpiStrip />

          {/* FASE 4 will replace this placeholder grid with the real visualizations */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {UPCOMING.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-ink-faint"
              >
                <Icon className="size-5" strokeWidth={1.5} />
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[0.65rem] tracking-wider uppercase">Fase 4</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
