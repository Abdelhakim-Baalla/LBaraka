// =============================================================================
// CLIENT API - Configuration Axios pour communiquer avec le backend NestJS
// =============================================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Changer cette IP selon ton cas
// - Émulateur Android: 10.0.2.2:3000
// - Téléphone physique: IP WiFi de ton PC (ex: 192.168.1.X:3000)
const BASE_URL = 'http://10.0.2.2:3000';

// =============================================================================
// CRÉATION DU CLIENT AXIOS
// =============================================================================

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// INTERCEPTEUR - Ajoute automatiquement le token JWT à chaque requête
// =============================================================================

api.interceptors.request.use(
  async (config) => {
    // On récupère le token depuis AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    // Si un token existe, on l'ajoute dans l'en-tête Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // En cas d'erreur, on rejette la promesse
    return Promise.reject(error);
  }
);

// =============================================================================
// FONCTIONS D'AUTHENTIFICATION
// =============================================================================

// Inscription d'un nouvel utilisateur
export const register = async (
  nom: string,
  email: string,
  motDePasse: string,
  cin: string
) => {
  const response = await api.post('/auth/register', {
    nom,
    email,
    motDePasse,
    cin,
  });
  return response.data;
};

// Connexion d'un utilisateur existant
export const login = async (email: string, motDePasse: string) => {
  const response = await api.post('/auth/login', {
    email,
    motDePasse,
  });
  
  // Si la connexion réussit, on sauvegarde le token
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
  }
  
  return response.data;
};

// Déconnexion - supprime le token
export const logout = async () => {
  await AsyncStorage.removeItem('token');
};

// Récupère le profil de l'utilisateur connecté
export const getMonProfil = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Vérifie si l'utilisateur est connecté (utilise le token s'il existe)
export const checkAuth = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    return getMonProfil();
  }
  return null;
};

// =============================================================================
// FONCTIONS POUR LES ANNONCES
// =============================================================================

export const getAnnonces = async () => {
  const response = await api.get('/annonces');
  return response.data;
};

export const createAnnonce = async (data: {
  titre: string;
  description: string;
  type: string;
  points?: number;
}) => {
  const response = await api.post('/annonces', data);
  return response.data;
};

// =============================================================================
// FONCTIONS POUR LE WALLET
// =============================================================================

export const getWallet = async () => {
  const response = await api.get('/wallet');
  return response.data;
};

export default api;
