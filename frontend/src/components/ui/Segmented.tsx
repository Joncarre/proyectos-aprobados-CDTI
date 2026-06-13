import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * Full-width segmented control with a sliding indicator (used for the PYME
 * tri-state). Premium feel: spring-animated pill, press scale, mono labels.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-0.5 rounded-xl border border-line bg-surface-2 p-1"
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
            className="relative flex-1 rounded-lg px-2 py-1.5 text-[0.7rem] font-medium transition-transform duration-150 active:scale-95"
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="shadow-card absolute inset-0 rounded-lg bg-surface ring-1 ring-black/[0.03]"
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
