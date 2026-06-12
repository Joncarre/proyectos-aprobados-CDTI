import { useState } from 'react';
import type { MinMaxPair } from '../../state/filters';
import { useFiltersStore } from '../../state/filters';
import { formatMoneyCompact } from '../../lib/format';
import { RangeSlider } from '../ui/RangeSlider';

const POS_MAX = 1000;

/** Round to 2 significant digits so slider values look intentional (1.2M, not 1187423). */
const roundNice = (value: number): number => {
  if (value < 100) return Math.round(value);
  const exponent = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / exponent) * exponent;
};

interface RangeFilterProps {
  pair: MinMaxPair;
  max: number;
  /** 'log' for money (0 → 80M needs it); 'linear' for percentages. */
  scale: 'log' | 'linear';
  unit: 'money' | 'pct';
  label: string;
}

export function RangeFilter({ pair, max, scale, unit, label }: RangeFilterProps) {
  const [minKey, maxKey] = pair;
  const currentMin = useFiltersStore((state) => state.filters[minKey]);
  const currentMax = useFiltersStore((state) => state.filters[maxKey]);
  const setRange = useFiltersStore((state) => state.setRange);

  const toPos = (value: number): number =>
    scale === 'log'
      ? Math.round((Math.log(value + 1) / Math.log(max + 1)) * POS_MAX)
      : Math.round((value / max) * POS_MAX);

  const toValue = (pos: number): number => {
    if (pos <= 0) return 0;
    if (pos >= POS_MAX) return max;
    return scale === 'log'
      ? roundNice(Math.pow(max + 1, pos / POS_MAX) - 1)
      : Math.round((pos / POS_MAX) * max);
  };

  const committedPos: [number, number] = [toPos(currentMin ?? 0), toPos(currentMax ?? max)];
  const [dragPos, setDragPos] = useState<[number, number] | null>(null);
  const pos = dragPos ?? committedPos;
  const [low, high] = [toValue(pos[0]), toValue(pos[1])];

  const commitValues = (minValue: number, maxValue: number): void => {
    setRange(pair, [minValue > 0 ? minValue : undefined, maxValue < max ? maxValue : undefined]);
  };

  const display = (value: number): string =>
    unit === 'money' ? formatMoneyCompact(value) : `${value} %`;

  const parseInput = (raw: string): number | null => {
    const value = Number(raw.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? Math.min(value, max) : null;
  };

  return (
    <div className="space-y-2">
      <RangeSlider
        value={pos}
        onValueChange={setDragPos}
        onValueCommit={(committed) => {
          setDragPos(null);
          commitValues(toValue(committed[0]), toValue(committed[1]));
        }}
        ariaLabelMin={`${label}: mínimo`}
        ariaLabelMax={`${label}: máximo`}
      />
      <div className="flex items-center justify-between gap-2">
        <RangeInput
          key={`min-${low}`}
          defaultValue={low}
          ariaLabel={`${label}: mínimo exacto`}
          onCommit={(value) => commitValues(value, high)}
          parse={parseInput}
        />
        <span className="text-xs text-ink-faint">–</span>
        <RangeInput
          key={`max-${high}`}
          defaultValue={high}
          ariaLabel={`${label}: máximo exacto`}
          onCommit={(value) => commitValues(low, value)}
          parse={parseInput}
        />
      </div>
      <p className="text-center text-xs text-ink-soft tabular-nums">
        {display(low)} — {display(high)}
      </p>
    </div>
  );
}

interface RangeInputProps {
  defaultValue: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
  parse: (raw: string) => number | null;
}

function RangeInput({ defaultValue, ariaLabel, onCommit, parse }: RangeInputProps) {
  const commit = (raw: string): void => {
    const value = parse(raw);
    if (value !== null && value !== defaultValue) onCommit(value);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      defaultValue={Math.round(defaultValue)}
      aria-label={ariaLabel}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(event.currentTarget.value);
      }}
      className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs tabular-nums transition-colors outline-none hover:border-line-strong focus:border-accent"
    />
  );
}
