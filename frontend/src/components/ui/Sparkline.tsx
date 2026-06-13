interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

/** Tiny inline trend line with a soft area fill and an end dot. */
export function Sparkline({
  values,
  color = '#4f46e5',
  width = 60,
  height = 20,
  className,
}: SparklineProps) {
  if (values.length < 2) return null;

  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((value - min) / range) * (height - 2 * pad);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1]!;
  const first = points[0]!;
  const area = `${first[0]},${height} ${line} ${last[0]},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polygon points={area} fill={color} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={1.7} fill={color} />
    </svg>
  );
}
