import { lazy, Suspense, useState } from 'react';
import { useMeta } from '../../api/queries';
import { cn } from '../../lib/cn';
import { ActiveFilterChips } from '../filters/ActiveFilterChips';
import { FilterPanel } from '../filters/FilterPanel';
import { KpiStrip } from '../kpi/KpiStrip';
import { Skeleton } from '../ui/Skeleton';
import { Header } from './Header';

const Dashboard = lazy(() => import('../Dashboard'));

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-busy="true">
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
      <Header filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((open) => !open)} />
      <div className="flex">
        <aside
          aria-label="Panel de filtros"
          aria-hidden={!filtersOpen}
          className={cn(
            'sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-line bg-surface transition-[width] duration-200',
            filtersOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0',
          )}
        >
          <div className="w-80 p-4">
            <FilterPanel />
          </div>
        </aside>

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
