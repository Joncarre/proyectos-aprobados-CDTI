import * as SliderPrimitive from '@radix-ui/react-slider';

interface RangeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  onValueCommit: (value: [number, number]) => void;
  ariaLabelMin: string;
  ariaLabelMax: string;
  min?: number;
  max?: number;
  step?: number;
}

// Premium thumb: white disc with an accent core, soft ring that blooms on
// hover/drag, grip-like inner dot. Built from nested spans via ::before.
const thumbClass =
  'group/thumb relative block size-4 rounded-full border border-accent-line bg-surface shadow-[0_1px_3px_rgb(26_26_30/0.18)] ' +
  'ring-4 ring-accent/0 transition-[transform,box-shadow] duration-150 ' +
  'before:absolute before:inset-1/2 before:size-1.5 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-accent before:transition-transform ' +
  'hover:scale-110 hover:ring-accent/15 hover:before:scale-125 ' +
  'active:scale-105 active:ring-accent/25 ' +
  'focus-visible:ring-accent/30 focus-visible:outline-none';

export function RangeSlider({
  value,
  onValueChange,
  onValueCommit,
  ariaLabelMin,
  ariaLabelMax,
  min = 0,
  max = 1000,
  step = 1,
}: RangeSliderProps) {
  return (
    <SliderPrimitive.Root
      className="relative flex h-5 w-full touch-none items-center select-none"
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={(v) => onValueChange(v as [number, number])}
      onValueCommit={(v) => onValueCommit(v as [number, number])}
      minStepsBetweenThumbs={0}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-accent to-accent-strong" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={thumbClass} aria-label={ariaLabelMin} />
      <SliderPrimitive.Thumb className={thumbClass} aria-label={ariaLabelMax} />
    </SliderPrimitive.Root>
  );
}
