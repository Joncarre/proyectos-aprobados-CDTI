import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { MetaResponse } from '@cdti/shared';
import { cn } from '../lib/cn';
import { MapCard } from './charts/MapCard';
import { TimeSeriesCard } from './charts/TimeSeriesCard';
import { SeasonalityCard } from './charts/SeasonalityCard';
import { CohortsCard } from './charts/CohortsCard';
import { HeatmapCard } from './charts/HeatmapCard';
import { RankingsCard } from './charts/RankingsCard';
import { DistributionCard } from './charts/DistributionCard';
import { PymeComparisonCard } from './charts/PymeComparisonCard';
import { AreaGraphCard } from './charts/AreaGraphCard';
import { CompaniesCard } from './charts/CompaniesCard';
import { ProjectsTable } from './table/ProjectsTable';

const container = {
  hidden: {},
  // Starts after the KPI strip has rolled in, then cascades the cards top-to-bottom
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.6 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Grid cell that fades and slides up in sequence on first render. */
function Cell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <motion.div variants={item} className={cn(wide && 'min-[1700px]:col-span-2')}>
      {children}
    </motion.div>
  );
}

/**
 * Lazy-loaded: pulls ECharts + the geo atlas only when the dashboard mounts.
 * Renders immediately so data loads behind the splash, but the staggered
 * entrance is held back until `reveal` flips true.
 */
export default function Dashboard({ meta, reveal }: { meta: MetaResponse; reveal: boolean }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate={reveal ? 'show' : 'hidden'}
      className="grid grid-cols-1 gap-3 min-[1700px]:grid-cols-2"
    >
      <Cell wide>
        <MapCard meta={meta} />
      </Cell>
      <Cell>
        <TimeSeriesCard />
      </Cell>
      <Cell>
        <SeasonalityCard />
      </Cell>
      <Cell>
        <CohortsCard />
      </Cell>
      <Cell>
        <CompaniesCard />
      </Cell>
      <Cell wide>
        <AreaGraphCard />
      </Cell>
      <Cell>
        <HeatmapCard />
      </Cell>
      <Cell>
        <RankingsCard />
      </Cell>
      <Cell>
        <DistributionCard />
      </Cell>
      <Cell>
        <PymeComparisonCard />
      </Cell>
      <Cell wide>
        <ProjectsTable />
      </Cell>
    </motion.div>
  );
}
