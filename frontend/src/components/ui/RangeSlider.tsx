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

const thumbClass =
  'block size-4 rounded-full border-2 border-accent bg-surface shadow-card transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

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
      <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={thumbClass} aria-label={ariaLabelMin} />
      <SliderPrimitive.Thumb className={thumbClass} aria-label={ariaLabelMax} />
    </SliderPrimitive.Root>
  );
}
