import { useFiltersStore } from '../../state/filters';
import { Segmented } from '../ui/Segmented';

const OPTIONS = [
  { value: 'todas', label: 'Todas' },
  { value: 'si', label: 'PYME' },
  { value: 'no', label: 'No PYME' },
] as const;

export function PymeFilter() {
  const pyme = useFiltersStore((state) => state.filters.pyme);
  const setPyme = useFiltersStore((state) => state.setPyme);

  return (
    <Segmented
      options={OPTIONS}
      value={pyme ?? 'todas'}
      onChange={(value) => setPyme(value === 'todas' ? undefined : value)}
      ariaLabel="Filtrar por condición de PYME"
    />
  );
}
