import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFiltersStore } from '../../state/filters';

/** Free-text search over project title and company name, debounced 300 ms. */
export function TextSearch() {
  const q = useFiltersStore((state) => state.filters.q);
  const setQ = useFiltersStore((state) => state.setQ);
  const [draft, setDraft] = useState(q ?? '');

  // External changes (clear chips, URL navigation) reset the input
  useEffect(() => {
    setDraft(q ?? '');
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = draft.trim();
      const next = trimmed.length >= 2 ? trimmed : undefined;
      if (next !== q) setQ(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, q, setQ]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 transition-colors focus-within:border-accent hover:border-line-strong">
      <Search className="size-4 shrink-0 text-ink-faint" />
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Buscar título o empresa…"
        aria-label="Buscar en título del proyecto o razón social"
        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
      />
      {draft !== '' && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Borrar búsqueda"
          className="text-ink-faint transition-colors hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
