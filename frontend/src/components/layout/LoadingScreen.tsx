import { motion } from 'motion/react';

/**
 * First-visit splash over the content area: a spinning ring around the brand
 * mark, a message and a progress bar that fills across the ~2s warm-up while
 * the panels load their data behind it. Fades out on dismiss.
 */
export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="absolute inset-0 z-30 bg-page"
    >
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-5">
        <div className="relative size-14">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-accent/15 border-t-accent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          />
          <motion.span
            className="absolute inset-2.5 grid place-items-center rounded-xl bg-accent text-sm font-bold text-white"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
          >
            C
          </motion.span>
        </div>

        <p className="font-mono text-sm text-ink-soft">Procesando información…</p>

        <div className="h-1 w-52 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.9, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
