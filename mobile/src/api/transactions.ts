import { apiFetch } from './client';

export const reserveAnnonce = (token: string, annonceId: string) =>
  apiFetch(`/transactions/reserve/${annonceId}`, { method: 'POST' }, token);

export const getMyTransactions = (token: string) =>
  apiFetch('/transactions/me', {}, token);

export const getContratByTransaction = (token: string, transactionId: string) =>
  apiFetch(`/contrats/transaction/${transactionId}`, {}, token);

export const validerRetour = (token: string, transactionId: string) =>
  apiFetch(`/transactions/${transactionId}/valider-retour`, { method: 'POST' }, token);
