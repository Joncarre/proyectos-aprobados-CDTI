const intFormat = new Intl.NumberFormat('es-ES');
const compactCurrency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const fullCurrency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const formatInt = (value: number): string => intFormat.format(value);

/** "14,2 M€" — for KPIs and axis labels. */
export const formatMoneyCompact = (value: number): string => compactCurrency.format(value);

/** "347.644 €" — for tables and tooltips. */
export const formatMoney = (value: number): string => fullCurrency.format(value);

export const formatPct = (value: number | null): string =>
  value === null ? '—' : `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;

export const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;
