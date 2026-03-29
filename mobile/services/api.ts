// API Service for LBaraka Backend Integration
// Place this in: mobile/services/api.ts

import { useAuth } from '@clerk/expo';

const API_BASE_URL = 'http://localhost:3000'; // Change to your backend URL

export class ApiService {
  private static async getAuthHeaders(token?: string) {
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Sync Clerk user with LBaraka backend after successful sign-up
   */
  static async syncUserWithBackend(clerkUser: any, additionalData: {
    telephone: string;
    cin?: string;
  }) {
    try {
      const token = await clerkUser.getToken();
      
      const response = await fetch(`${API_BASE_URL}/auth/clerk-sync`, {
        method: 'POST',
        headers: await this.getAuthHeaders(token),
        body: JSON.stringify({
          email: clerkUser.emailAddresses[0].emailAddress,
          clerkId: clerkUser.id,
          telephone: additionalData.telephone,
          cin: additionalData.cin,
          nom: clerkUser.firstName || '',
          prenom: clerkUser.lastName || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend sync error:', error);
      throw error;
    }
  }

  /**
   * Login with backend (if using backend auth instead of Clerk)
   */
  static async loginWithBackend(email: string, motDePasse: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ email, motDePasse })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register with backend (if using backend auth instead of Clerk)
   */
  static async registerWithBackend(data: {
    email: string;
    motDePasse: string;
    telephone: string;
    cin?: string;
    nom?: string;
    prenom?: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/utilisateur/me`, {
        method: 'GET',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(token: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/utilisateur/me`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(token),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
}

/**
 * React Hook for API calls with Clerk authentication
 */
export function useApi() {
  const { getToken } = useAuth();

  const callApi = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  return { callApi };
}

/**
 * Example usage in a component:
 * 
 * import { useApi } from '@/services/api';
 * 
 * const MyComponent = () => {
 *   const { callApi } = useApi();
 * 
 *   const fetchAnnonces = async () => {
 *     try {
 *       const data = await callApi('/annonces');
 *       console.log(data);
 *     } catch (error) {
 *       console.error(error);
 *     }
 *   };
 * 
 *   return <View>...</View>;
 * };
 */
