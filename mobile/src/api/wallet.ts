import { apiFetch } from './client';

export const getWallet = (token: string) =>
  apiFetch('/wallet/me', {}, token);

export const depotWallet = (token: string, montant: number) =>
  apiFetch('/wallet/depot', {
    method: 'POST',
    body: JSON.stringify({ montant }),
  }, token);

export const retraitWallet = (token: string, montant: number) =>
  apiFetch('/wallet/retrait', { // Optional, si on a un endpoint retrait
    method: 'POST',
    body: JSON.stringify({ montant }),
  }, token);
