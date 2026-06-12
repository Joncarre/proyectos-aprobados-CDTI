import { filtersToSearchParams, parseFilters } from '../lib/searchParams';
import { useFiltersStore } from './filters';

/**
 * Two-way binding between the filters store and the URL query string, so any
 * view is shareable as a link. Uses replaceState: slider/typing interactions
 * must not flood the browser history.
 */
export function initUrlSync(): void {
  useFiltersStore.getState().replaceAll(parseFilters(window.location.search));

  window.addEventListener('popstate', () => {
    useFiltersStore.getState().replaceAll(parseFilters(window.location.search));
  });

  useFiltersStore.subscribe((state, previous) => {
    if (state.filters === previous.filters) return;
    const queryString = filtersToSearchParams(state.filters).toString();
    const url = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    history.replaceState(null, '', url);
  });
}
