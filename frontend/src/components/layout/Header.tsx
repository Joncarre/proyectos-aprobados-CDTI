import { useMeta } from '../../api/queries';

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
        <span className="hidden text-xs text-ink-faint md:block">
          — Datos abiertos
          {meta ? `, actualizado el día ${formatIngestDate(meta.ingest.ingestedAt)}` : ''}
        </span>
      </div>

      <p className="hidden items-baseline gap-1.5 font-sans text-xs tracking-wide text-ink-soft md:flex">
        Desarrollado por
        <a
          href="https://jonathancarrero.es/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-gradient-to-r from-[#3f7ce0] to-[#2a4cb8] bg-clip-text font-serif text-[17px] text-transparent"
        >
          Jonathan Carrero
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-gradient-to-r from-[#3f7ce0] to-[#2a4cb8] transition-[width] duration-[600ms] ease-out group-hover:w-full"
            style={{
              maskImage: 'linear-gradient(to right, transparent, #000 42%, #000 58%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, #000 42%, #000 58%, transparent)',
            }}
          />
        </a>
      </p>
    </header>
  );
}
