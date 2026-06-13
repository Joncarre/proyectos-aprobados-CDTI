import { useMeta } from '../../api/queries';
import { formatInt } from '../../lib/format';

const formatIngestDate = (timestamp: string): string => {
  const date = timestamp.slice(0, 10).split('-');
  return `${date[2]}/${date[1]}/${date[0]}`;
};

export function Header() {
  const { data: meta } = useMeta();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink-strong">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden className="size-6 text-accent">
            <path
              d="M21.8 9.1 A9 9 0 1 0 21.8 22.9"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          PROYECTOS APROBADOS POR EL CDTI
        </span>
        <span className="hidden text-xs text-ink-faint sm:block">— Datos abiertos</span>
      </div>
      {meta && (
        <p className="hidden font-mono text-xs text-ink-soft md:block">
          {formatInt(meta.ingest.nProjects)} proyectos · Última actualización el día{' '}
          {formatIngestDate(meta.ingest.ingestedAt)}
        </p>
      )}
    </header>
  );
}
