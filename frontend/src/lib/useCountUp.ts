import { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';

/**
 * Tweens a number towards `value` whenever it changes. The underlying motion
 * value keeps its position across renders (and StrictMode's double effect), so
 * it always resumes from where it is — rolling up from 0 on first mount.
 */
export function useCountUp(value: number, duration = 0.6): number {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return display;
}
