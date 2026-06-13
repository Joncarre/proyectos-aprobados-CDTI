import { motion } from 'motion/react';

const BAR_FEATHER =
  'linear-gradient(to right, transparent 0%, #000 26%, #000 74%, transparent 100%)';
const BARS = [0, 1, 2, 3, 4];

/**
 * First-visit splash over the content area: an equalizer-style wave of bars, a
 * message and a gradient progress bar with heavily feathered edges that fills
 * across the ~2s warm-up while the panels load behind it. Fades out on dismiss.
 */
export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="absolute inset-0 z-30 bg-page"
    >
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6">
        {/* Equalizer wave: blue bars rising and falling in sequence */}
        <div className="flex h-10 items-center gap-1.5">
          {BARS.map((index) => (
            <motion.span
              key={index}
              className="h-full w-1.5 rounded-full bg-gradient-to-b from-[#818cf8] to-[#4338ca]"
              style={{ transformOrigin: 'center' }}
              animate={{ scaleY: [0.35, 1, 0.35] }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: 'easeInOut',
                delay: index * 0.13,
              }}
            />
          ))}
        </div>

        <p className="font-mono text-sm text-ink-soft">Procesando información…</p>

        <div
          className="relative h-1.5 w-72 overflow-hidden rounded-full"
          style={{ maskImage: BAR_FEATHER, WebkitMaskImage: BAR_FEATHER }}
        >
          <div className="absolute inset-0 rounded-full bg-line/50" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#a5b4fc] via-[#6366f1] to-[#3730a3]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.9, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
