// api/auth.ts
import { apiFetch } from './client';

export const getProfile = (token: string) =>
  apiFetch('/auth/me', {}, token);

export const login = (email: string, motDePasse: string) =>
  apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, motDePasse }),
  });

export const register = (data: {
  email: string;
  motDePasse: string;
  telephone: string;
  cin?: string;
}) =>
  apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
