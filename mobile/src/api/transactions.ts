import { apiFetch } from './client';

export const reserveAnnonce = (token: string, annonceId: string) =>
  apiFetch('/transactions/reserver', {
    method: 'POST',
    body: JSON.stringify({ annonceId }),
  }, token);

export const getMyTransactions = (token: string) =>
  apiFetch('/transactions/me', {}, token);
