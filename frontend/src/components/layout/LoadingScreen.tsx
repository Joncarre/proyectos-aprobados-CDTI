import { motion } from 'motion/react';

const RING_MASK =
  'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))';
const BAR_FEATHER =
  'linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)';

/**
 * First-visit splash over the content area: a conic-gradient spinner, a message
 * and a gradient progress bar with feathered edges that fills across the ~2s
 * warm-up while the panels load their data behind it. Fades out on dismiss.
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
        {/* Premium conic spinner: faint track + rotating gradient comet with a soft glow */}
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-accent/10" />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, #818cf8 110deg, #4f46e5 330deg)',
              WebkitMask: RING_MASK,
              mask: RING_MASK,
              filter: 'drop-shadow(0 0 6px rgb(79 70 229 / 0.35))',
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          />
        </div>

        <p className="font-mono text-sm text-ink-soft">Procesando información…</p>

        <div
          className="relative h-1.5 w-72 overflow-hidden rounded-full"
          style={{ maskImage: BAR_FEATHER, WebkitMaskImage: BAR_FEATHER }}
        >
          <div className="absolute inset-0 rounded-full bg-line/50" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#818cf8] via-[#4f46e5] to-[#0d9488]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.9, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
