import type { ReactNode } from 'react';
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
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink-strong">{title}</h3>
          {subtitle !== undefined && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
        </div>
        {controls !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5">{controls}</div>
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

/** Small pill-button group for chart-level controls (metric/dimension switches). */
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
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap transition-colors',
            value === option.value
              ? 'shadow-card bg-surface text-ink'
              : 'text-ink-soft hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
