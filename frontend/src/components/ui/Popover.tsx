import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps {
  children: ReactNode;
  /** Default: the popover is exactly as wide as its trigger (filter fields). */
  matchTriggerWidth?: boolean;
  className?: string;
}

export function PopoverContent({
  children,
  matchTriggerWidth = true,
  className,
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          'shadow-pop z-50 rounded-xl bg-surface p-2 outline-none',
          matchTriggerWidth ? 'w-[var(--radix-popover-trigger-width)]' : 'w-56',
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
