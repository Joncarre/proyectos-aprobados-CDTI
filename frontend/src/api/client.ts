const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function getJson<T>(path: string, params?: URLSearchParams): Promise<T> {
  const queryString = params?.toString();
  const response = await fetch(`${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`);
  if (!response.ok) {
    throw new Error(`API ${response.status} en ${path}`);
  }
  return response.json() as Promise<T>;
}
