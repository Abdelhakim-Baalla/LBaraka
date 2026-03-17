import { BASE_URL, apiFetch } from './client';

export const getAnnonces = (token: string) =>
  apiFetch('/annonces', {}, token);

export const createAnnonce = async (
  token: string,
  data: {
    titre: string;
    description: string;
    categorie: string;
    mode: string;
    condition: string;
    geolocalisation: number[];
  },
  photos: Array<{ uri: string; name: string; type: string }>,
) => {
  const form = new FormData();
  form.append('titre', data.titre);
  form.append('description', data.description);
  form.append('categorie', data.categorie);
  form.append('mode', data.mode);
  form.append('condition', data.condition);
  form.append('geolocalisation', JSON.stringify(data.geolocalisation));
  photos.forEach((p) => form.append('photos', p as any));

  const res = await fetch(`${BASE_URL}/annonces`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Erreur serveur');
  return json;
};
