import { lazy, Suspense, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useMeta } from '../../api/queries';
import { cn } from '../../lib/cn';
import { ActiveFilterChips } from '../filters/ActiveFilterChips';
import { FilterPanel } from '../filters/FilterPanel';
import { KpiStrip } from '../kpi/KpiStrip';
import { Skeleton } from '../ui/Skeleton';
import { Header } from './Header';

const Dashboard = lazy(() => import('../Dashboard'));

const PANEL_WIDTH = 320; // w-80
const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[1700px]:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[26rem] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AppShell() {
  const { data: meta } = useMeta();
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <aside
          aria-label="Panel de filtros"
          aria-hidden={!filtersOpen}
          style={{ transitionTimingFunction: PANEL_EASE }}
          className={cn(
            'sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r border-line bg-surface font-mono transition-[width] duration-500',
            filtersOpen ? 'w-80' : 'w-0 border-r-0',
          )}
        >
          <div
            style={{ transitionTimingFunction: PANEL_EASE }}
            className={cn(
              'h-full w-80 overflow-y-auto p-4 transition-[opacity,transform] duration-500',
              filtersOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
            )}
          >
            <FilterPanel />
          </div>
        </aside>

        {/* Collapse/expand tab, vertically centered on the panel edge */}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-label={filtersOpen ? 'Ocultar panel de filtros' : 'Mostrar panel de filtros'}
          aria-expanded={filtersOpen}
          style={{ left: filtersOpen ? PANEL_WIDTH : 0, transitionTimingFunction: PANEL_EASE }}
          className="shadow-card fixed top-1/2 z-50 flex h-11 w-4 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-line bg-surface text-accent transition-[left,background-color,color] duration-500 hover:bg-accent hover:text-white"
        >
          <ChevronLeft
            className={cn('size-3.5 transition-transform duration-500', !filtersOpen && 'rotate-180')}
            style={{ transitionTimingFunction: PANEL_EASE }}
          />
        </button>

        <main className="min-w-0 flex-1 space-y-4 p-5">
          <ActiveFilterChips />
          <KpiStrip />
          {meta ? (
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard meta={meta} />
            </Suspense>
          ) : (
            <DashboardSkeleton />
          )}
        </main>
      </div>
    </div>
  );
}
