/** Lowercase + accent-stripped, for client-side option filtering («cataluna» finds «Cataluña»). */
export const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '');

export const matches = (haystack: string, needle: string): boolean =>
  normalize(haystack).includes(normalize(needle));
