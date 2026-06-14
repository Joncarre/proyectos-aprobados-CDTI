import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useMeta } from '../../api/queries';
import { cn } from '../../lib/cn';
import { ActiveFilterChips } from '../filters/ActiveFilterChips';
import { FilterPanel } from '../filters/FilterPanel';
import { KpiStrip } from '../kpi/KpiStrip';
import { Skeleton } from '../ui/Skeleton';
import { Header } from './Header';
import { LoadingScreen } from './LoadingScreen';

const Dashboard = lazy(() => import('../Dashboard'));

const PANEL_WIDTH = 320; // w-80
const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const WARMUP_MS = 2000; // first-visit splash duration
const WIDE_QUERY = '(min-width: 1024px)'; // lg: push sidebar vs. overlay drawer

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

  // On wide screens the filter panel pushes content and is open by default; on
  // tablet/phone it becomes an overlay drawer, closed by default so the
  // dashboard gets the full width.
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  const [filtersOpen, setFiltersOpen] = useState(isWide);

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const onChange = (event: MediaQueryListEvent): void => {
      setIsWide(event.matches);
      setFiltersOpen(event.matches); // open when going wide, collapse when narrowing
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // First-visit warm-up: the content renders behind the splash so every panel
  // loads its data; the cards then reveal once the timer (and meta) are ready.
  const [timerDone, setTimerDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), WARMUP_MS);
    return () => clearTimeout(timer);
  }, []);
  const ready = timerDone && !!meta;

  const overlayOpen = filtersOpen && !isWide;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <aside
          aria-label="Panel de filtros"
          aria-hidden={!filtersOpen}
          style={{ transitionTimingFunction: PANEL_EASE }}
          className={cn(
            'top-14 z-40 h-[calc(100vh-3.5rem)] overflow-hidden border-r border-line bg-surface font-mono',
            // Narrow: fixed overlay drawer that slides in from the left
            'fixed left-0 w-80 transition-transform duration-500',
            // Wide (lg+): in-flow sticky sidebar whose width animates (the width
            // lives only in the open/closed states to avoid a class conflict)
            'lg:sticky lg:shrink-0 lg:translate-x-0 lg:transition-[width]',
            filtersOpen ? 'translate-x-0 lg:w-80' : '-translate-x-full lg:w-0 lg:border-r-0',
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

        {/* Backdrop: only on the overlay (narrow) layout, closes on tap */}
        {overlayOpen && (
          <button
            type="button"
            aria-label="Cerrar panel de filtros"
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-x-0 top-14 bottom-0 z-30 bg-ink-strong/30 backdrop-blur-[1px] lg:hidden"
          />
        )}

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
            className={cn(
              'size-3.5 transition-transform duration-500',
              !filtersOpen && 'rotate-180',
            )}
            style={{ transitionTimingFunction: PANEL_EASE }}
          />
        </button>

        <main className="relative min-w-0 flex-1 space-y-4 p-5">
          <ActiveFilterChips />
          <KpiStrip reveal={ready} />
          {meta ? (
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard meta={meta} reveal={ready} />
            </Suspense>
          ) : (
            <DashboardSkeleton />
          )}

          <AnimatePresence>{!ready && <LoadingScreen key="loading" />}</AnimatePresence>
        </main>
      </div>
    </div>
  );
}
