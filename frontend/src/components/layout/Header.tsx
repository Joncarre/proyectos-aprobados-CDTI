import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMeta } from '../../api/queries';
import { formatInt } from '../../lib/format';

const formatIngestDate = (timestamp: string): string => {
  const date = timestamp.slice(0, 10).split('-');
  return `${date[2]}/${date[1]}/${date[0]}`;
};

interface HeaderProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export function Header({ filtersOpen, onToggleFilters }: HeaderProps) {
  const { data: meta } = useMeta();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleFilters}
          aria-label={filtersOpen ? 'Ocultar panel de filtros' : 'Mostrar panel de filtros'}
          aria-expanded={filtersOpen}
          className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {filtersOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </button>
        <div className="flex items-baseline gap-2.5">
          <span className="flex items-center gap-2 text-[0.95rem] font-semibold tracking-tight">
            <span className="grid size-6 place-items-center rounded-md bg-accent text-xs font-bold text-white">
              C
            </span>
            Proyectos CDTI
          </span>
          <span className="hidden text-xs text-ink-faint sm:block">Explorador de datos</span>
        </div>
      </div>
      {meta && (
        <p className="font-mono text-xs text-ink-soft">
          {formatInt(meta.ingest.nProjects)} proyectos · datos del{' '}
          {formatIngestDate(meta.ingest.ingestedAt)}
        </p>
      )}
    </header>
  );
}
