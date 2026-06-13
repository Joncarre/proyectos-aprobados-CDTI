import type { MetaResponse } from '@cdti/shared';
import { MapCard } from './charts/MapCard';
import { TimeSeriesCard } from './charts/TimeSeriesCard';
import { HeatmapCard } from './charts/HeatmapCard';
import { RankingsCard } from './charts/RankingsCard';
import { DistributionCard } from './charts/DistributionCard';
import { TreemapCard } from './charts/TreemapCard';
import { CompaniesCard } from './charts/CompaniesCard';
import { ProjectsTable } from './table/ProjectsTable';

/** Lazy-loaded: pulls ECharts + the geo atlas only when the dashboard mounts. */
export default function Dashboard({ meta }: { meta: MetaResponse }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[1700px]:grid-cols-2">
      <div className="min-[1700px]:col-span-2">
        <MapCard meta={meta} />
      </div>
      <TimeSeriesCard />
      <HeatmapCard />
      <RankingsCard />
      <DistributionCard />
      <TreemapCard />
      <CompaniesCard />
      <div className="min-[1700px]:col-span-2">
        <ProjectsTable />
      </div>
    </div>
  );
}
