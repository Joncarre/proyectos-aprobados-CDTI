import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ReactNode } from 'react';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ children }: { children: ReactNode }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="shadow-pop z-50 w-72 rounded-xl bg-surface p-2 outline-none data-[state=open]:animate-in"
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
