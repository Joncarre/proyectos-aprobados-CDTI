import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { matches } from '../../lib/text';
import { Checkbox } from '../ui/Checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

export interface OptionGroup {
  label: string | null;
  options: string[];
}

interface MultiSelectFilterProps {
  label: string;
  groups: OptionGroup[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  searchable?: boolean;
  disabled?: boolean;
}

export function MultiSelectFilter({
  label,
  groups,
  selected,
  onToggle,
  onClear,
  searchable = false,
  disabled = false,
}: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: search ? group.options.filter((option) => matches(option, search)) : group.options,
    }))
    .filter((group) => group.options.length > 0);

  return (
    <Popover onOpenChange={() => setSearch('')}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors',
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-line-strong',
          )}
        >
          <span className={cn('truncate', selected.length === 0 && 'text-ink-soft')}>{label}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {selected.length > 0 && (
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-accent-strong">
                {selected.length}
              </span>
            )}
            <ChevronDown className="size-4 text-ink-faint" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="font-mono">
        {searchable && (
          <div className="mb-1 flex items-center gap-2 border-b border-line px-2 pb-2">
            <Search className="size-4 shrink-0 text-ink-faint" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar…"
              aria-label={`Buscar en ${label}`}
              className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          {visibleGroups.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-ink-faint">Sin resultados</p>
          )}
          {visibleGroups.map((group) => (
            <div key={group.label ?? '_'}>
              {group.label !== null && (
                <p className="px-2 pt-2 pb-1 text-[0.65rem] font-semibold tracking-wider text-ink-faint uppercase">
                  {group.label}
                </p>
              )}
              {group.options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    onCheckedChange={() => onToggle(option)}
                  />
                  <span className="truncate">{option}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border-t border-line px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <X className="size-3" /> Limpiar selección
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
