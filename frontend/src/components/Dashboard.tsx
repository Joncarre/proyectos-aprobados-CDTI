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
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <MapCard meta={meta} />
      <TimeSeriesCard />
      <HeatmapCard />
      <div className="grid grid-cols-1 gap-3">
        <RankingsCard />
        <DistributionCard />
      </div>
      <TreemapCard />
      <CompaniesCard />
      <div className="xl:col-span-2">
        <ProjectsTable />
      </div>
    </div>
  );
}
