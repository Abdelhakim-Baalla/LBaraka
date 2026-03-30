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
   * Login with backend
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
   * Register with backend
   */
  static async registerWithBackend(data: {
    email: string;
    motDePasse: string;
    telephone: string;
    cin?: string;
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
      const response = await fetch(`${API_BASE_URL}/utilisateurs/profil`, {
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
      const response = await fetch(`${API_BASE_URL}/utilisateurs/profil`, {
        method: 'PUT',
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

  /**
   * Get public user profile
   */
  static async getPublicProfile(token: string, userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/utilisateurs/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch public profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Public profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async logout(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}
