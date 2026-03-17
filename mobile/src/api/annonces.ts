import { BASE_URL, apiFetch } from './client';

export const getAnnonces = (token: string, categorie?: string) =>
  apiFetch(`/annonces${categorie ? `?categorie=${categorie}` : ''}`, {}, token);

export const getAnnoncesNearby = (token: string, lat: number, lng: number, rayon?: number, categorie?: string) => {
  const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
  if (rayon) params.append('rayon', rayon.toString());
  if (categorie) params.append('categorie', categorie);
  return apiFetch(`/annonces/carte?${params.toString()}`, {}, token);
};

export const createAnnonce = async (
  token: string,
  data: {
    titre: string;
    description: string;
    categorie: string;
    mode: string;
    condition: string;
    geolocalisation: number[];
    prixSymbolique?: number;
    montantCaution?: number;
    estFoodRescue?: boolean;
    dateExpiration?: string;
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
  if (data.prixSymbolique) form.append('prixSymbolique', data.prixSymbolique.toString());
  if (data.montantCaution) form.append('montantCaution', data.montantCaution.toString());
  if (data.estFoodRescue) form.append('estFoodRescue', 'true');
  if (data.dateExpiration) form.append('dateExpiration', data.dateExpiration);
  
  photos.forEach((p) => {
    const file = {
      uri: p.uri,
      type: p.type,
      name: p.name,
    };
    form.append('photos', file as any);
  });

  const res = await fetch(`${BASE_URL}/annonces`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Erreur serveur');
  return json;
};
