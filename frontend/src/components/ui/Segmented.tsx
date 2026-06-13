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
            className="relative flex-1 rounded-lg px-2 py-1.5 text-[0.7rem] font-medium"
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="shadow-card absolute inset-0 rounded-lg bg-[#2b2d38] ring-1 ring-white/[0.06]"
              />
            )}
            <span
              className={cn(
                'relative z-10 transition-colors duration-200',
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
