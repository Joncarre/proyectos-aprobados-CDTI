import { lazy, Suspense } from 'react';
import { useMeta } from '../../api/queries';
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
