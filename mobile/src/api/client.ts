// IP de ta machine sur le réseau local
export const BASE_URL = 'http://172.16.8.157:3000';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');
  return data;
}
