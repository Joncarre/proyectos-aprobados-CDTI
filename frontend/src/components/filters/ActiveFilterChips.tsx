import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { ProjectFilters } from '@cdti/shared';
import { formatMoneyCompact, MONTH_LABELS } from '../../lib/format';
import { useFiltersStore, type MinMaxPair } from '../../state/filters';

interface ChipSpec {
  id: string;
  label: string;
  remove: () => void;
}

const listLabel = (prefix: string, values: ReadonlyArray<string | number>): string => {
  const [first, ...rest] = values;
  return rest.length === 0 ? `${prefix}: ${first}` : `${prefix}: ${first} +${rest.length}`;
};

function buildChips(
  filters: ProjectFilters,
  clearKey: (key: keyof ProjectFilters) => void,
  setRange: (pair: MinMaxPair, range: [number | undefined, number | undefined]) => void,
): ChipSpec[] {
  const chips: ChipSpec[] = [];

  if (filters.anios?.length) {
    const sorted = [...filters.anios].sort((a, b) => a - b);
    const contiguous = sorted.every(
      (year, index) => index === 0 || year === sorted[index - 1]! + 1,
    );
    const label =
      sorted.length === 1
        ? `Año: ${sorted[0]}`
        : contiguous
          ? `Años: ${sorted[0]}–${sorted[sorted.length - 1]}`
          : listLabel('Años', sorted);
    chips.push({ id: 'anios', label, remove: () => clearKey('anios') });
  }
  if (filters.meses?.length) {
    const names = [...filters.meses]
      .sort((a, b) => a - b)
      .map((m) => MONTH_LABELS[m - 1] ?? String(m));
    chips.push({
      id: 'meses',
      label: names.length <= 4 ? `Meses: ${names.join(' · ')}` : listLabel('Meses', names),
      remove: () => clearKey('meses'),
    });
  }

  const ranges: Array<{
    id: string;
    label: string;
    pair: MinMaxPair;
    min?: number;
    max?: number;
    money: boolean;
  }> = [
    {
      id: 'presupuesto',
      label: 'Presupuesto',
      pair: ['presupuestoMin', 'presupuestoMax'],
      min: filters.presupuestoMin,
      max: filters.presupuestoMax,
      money: true,
    },
    {
      id: 'aportacion',
      label: 'Aportación',
      pair: ['aportacionMin', 'aportacionMax'],
      min: filters.aportacionMin,
      max: filters.aportacionMax,
      money: true,
    },
    {
      id: 'pct',
      label: '% CDTI',
      pair: ['pctMin', 'pctMax'],
      min: filters.pctMin,
      max: filters.pctMax,
      money: false,
    },
  ];
  for (const range of ranges) {
    if (range.min === undefined && range.max === undefined) continue;
    const fmt = (value: number): string => (range.money ? formatMoneyCompact(value) : `${value} %`);
    const parts = [
      range.min !== undefined ? `≥ ${fmt(range.min)}` : null,
      range.max !== undefined ? `≤ ${fmt(range.max)}` : null,
    ].filter(Boolean);
    chips.push({
      id: range.id,
      label: `${range.label}: ${parts.join(' · ')}`,
      remove: () => setRange(range.pair, [undefined, undefined]),
    });
  }

  const lists: Array<{ id: keyof ProjectFilters; prefix: string; values: string[] | undefined }> = [
    { id: 'ccaa', prefix: 'CCAA', values: filters.ccaa },
    { id: 'provincias', prefix: 'Provincia', values: filters.provincias },
    { id: 'instrumentos', prefix: 'Instrumento', values: filters.instrumentos },
    { id: 'areas', prefix: 'Área', values: filters.areas },
    { id: 'origenes', prefix: 'Origen', values: filters.origenes },
    { id: 'tiposAyuda', prefix: 'Ayuda', values: filters.tiposAyuda },
  ];
  for (const list of lists) {
    if (!list.values?.length) continue;
    chips.push({
      id: list.id,
      label: listLabel(list.prefix, list.values),
      remove: () => clearKey(list.id),
    });
  }

  if (filters.pyme !== undefined) {
    chips.push({
      id: 'pyme',
      label: filters.pyme === 'si' ? 'Solo PYME' : 'Solo no PYME',
      remove: () => clearKey('pyme'),
    });
  }
  if (filters.q !== undefined) {
    chips.push({ id: 'q', label: `Texto: «${filters.q}»`, remove: () => clearKey('q') });
  }
  if (filters.nif !== undefined) {
    chips.push({ id: 'nif', label: `NIF: ${filters.nif}`, remove: () => clearKey('nif') });
  }

  return chips;
}

/** Splits "Prefix: value" so the prefix can be dimmed and the value emphasised. */
function splitLabel(label: string): { prefix: string | null; value: string } {
  const index = label.indexOf(': ');
  return index === -1
    ? { prefix: null, value: label }
    : { prefix: label.slice(0, index), value: label.slice(index + 2) };
}

export function ActiveFilterChips() {
  const filters = useFiltersStore((state) => state.filters);
  const clearKey = useFiltersStore((state) => state.clearKey);
  const setRange = useFiltersStore((state) => state.setRange);

  const chips = buildChips(filters, clearKey, setRange);

  return (
    <div className="flex min-h-7 flex-wrap items-center gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {chips.map((chip) => {
          const { prefix, value } = splitLabel(chip.label);
          return (
            <motion.span
              key={chip.id}
              layout
              initial={{ opacity: 0, scale: 0.92, y: -3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="shadow-card inline-flex h-7 items-stretch overflow-hidden rounded-lg border border-line bg-surface text-xs transition-[border-color,box-shadow] duration-200 hover:border-accent-line hover:shadow-pop"
            >
              {prefix !== null && (
                <span className="flex items-center bg-accent-soft px-2 text-[0.6rem] font-semibold tracking-wider text-accent-strong uppercase">
                  {prefix}
                </span>
              )}
              <span className="flex items-center px-2.5 font-semibold text-ink-strong">
                {value}
              </span>
              <button
                type="button"
                onClick={chip.remove}
                aria-label={`Quitar filtro ${chip.label}`}
                className="flex items-center border-l border-line px-1.5 text-ink-faint transition-colors hover:bg-accent hover:text-white"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
