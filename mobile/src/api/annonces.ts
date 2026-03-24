import { Platform } from 'react-native';
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
  photos: Array<{ uri: string; name: string; type: string; base64?: string }>,
) => {
  const payload = {
    ...data,
    photosBase64: photos.map(p => ({
      name: p.name,
      type: p.type,
      base64: p.base64,
    })),
  };

  const res = await apiFetch('/annonces', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);

  return res;
};
