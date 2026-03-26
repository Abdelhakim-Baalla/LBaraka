import { apiFetch } from './client';

/**
 * Récupérer tous les points relais
 */
export const getPointsRelais = (token: string) => {
  return apiFetch('/points-relais', {}, token);
};

/**
 * Récupérer les points relais à proximité
 */
export const getPointsRelaisNearby = (
  token: string, 
  lat: number, 
  lng: number, 
  rayon: number = 10,
  type?: string
) => {
  const params = new URLSearchParams({ 
    lat: lat.toString(), 
    lng: lng.toString(), 
    rayon: rayon.toString() 
  });
  if (type) params.append('type', type);

  return apiFetch(`/points-relais/nearby?${params.toString()}`, {}, token);
};

/**
 * Récupérer les types de points relais
 */
export const getPointRelaisTypes = () => {
  return apiFetch('/points-relais/types');
};
