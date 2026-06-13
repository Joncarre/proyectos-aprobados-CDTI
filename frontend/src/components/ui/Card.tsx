import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

interface CardProps {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  children: ReactNode;
  /** First load: shows a skeleton. */
  isPending?: boolean;
  /** Refetch with previous data on screen: dims the body. */
  isUpdating?: boolean;
  /** Height of the skeleton/body area while loading. */
  bodyHeight?: string;
  className?: string;
}

export function Card({
  title,
  subtitle,
  controls,
  children,
  isPending = false,
  isUpdating = false,
  bodyHeight = 'h-80',
  className,
}: CardProps) {
  return (
    <section className={cn('shadow-card rounded-xl border border-line bg-surface p-4', className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-ink-strong">{title}</h3>
          {subtitle !== undefined && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
        </div>
        {controls !== undefined && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{controls}</div>
        )}
      </header>
      {isPending ? (
        <Skeleton className={cn('w-full', bodyHeight)} />
      ) : (
        <div className={cn('transition-opacity duration-200', isUpdating && 'opacity-50')}>
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Pill-button group for chart-level controls (metric/dimension switches).
 * A shared layout indicator slides under the active option; pressing scales it.
 */
export function ControlGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-lg border border-line bg-surface-2 p-0.5 font-mono"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="relative rounded-md px-2.5 py-1 text-[0.7rem] font-medium whitespace-nowrap transition-transform duration-150 active:scale-90"
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                className="shadow-card absolute inset-0 rounded-md bg-surface ring-1 ring-black/[0.03]"
              />
            )}
            <span
              className={cn(
                'relative z-10 transition-colors',
                selected ? 'text-accent-strong' : 'text-ink-soft hover:text-ink',
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
