import Constants from 'expo-constants';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();

export class ApiService {
  // Récupère l'URL de l'API depuis l'hôte Expo en mode dev
  private static getExpoHostApiUrl() {
    const expoConfig = Constants.expoConfig as any;
    const hostUri = expoConfig?.hostUri as string | undefined;

    if (!hostUri || typeof hostUri !== 'string') {
      return '';
    }

    const host = hostUri.split(':')[0];

    if (!host) {
      return '';
    }

    return `http://${host}:3000`;
  }

  // Détermine l'URL de base de l'API (dev ou prod)
  private static getBaseUrl() {
    if (__DEV__) {
      const expoHostUrl = this.getExpoHostApiUrl();
      if (expoHostUrl) {
        return expoHostUrl;
      }
    }

    if (!API_BASE_URL) {
      throw new Error('EXPO_PUBLIC_API_URL est manquante. Configure-la dans mobile/.env');
    }

    return API_BASE_URL;
  }

  // Construit les headers avec le token JWT si fourni
  private static async getAuthHeaders(token?: string) {
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Extrait le message d'erreur de la réponse API
  private static async getErrorMessage(response: Response, fallbackMessage: string) {
    try {
      const data = await response.json();

      if (typeof data?.message === 'string') {
        return data.message;
      }

      if (Array.isArray(data?.message) && data.message.length > 0) {
        return String(data.message[0]);
      }

      return fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  // Connexion utilisateur
  static async loginWithBackend(email: string, motDePasse: string) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ email, motDePasse })
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Login failed');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Inscription utilisateur
  static async registerWithBackend(data: {
    email: string;
    motDePasse: string;
    telephone: string;
    cin?: string;
  }) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Registration failed');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Récupère le profil utilisateur
  static async getUserProfile(token: string) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/utilisateurs/profil`, {
        method: 'GET',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Failed to fetch user profile');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Met à jour le profil utilisateur
  static async updateUserProfile(token: string, data: any) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/utilisateurs/profil`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(token),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Failed to update profile');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Récupère le profil public d'un utilisateur
  static async getPublicProfile(token: string, userId: string) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/utilisateurs/${userId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Failed to fetch public profile');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Public profile fetch error:', error);
      throw error;
    }
  }

  // Déconnexion utilisateur
  static async logout(token: string) {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: await this.getAuthHeaders(token)
      });

      if (!response.ok) {
        const message = await this.getErrorMessage(response, 'Failed to logout');
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Récupère toutes les annonces avec filtre optionnel par catégorie
  static async getAnnonces(token: string, categorie?: string) {
    const baseUrl = this.getBaseUrl();
    const url = categorie ? `${baseUrl}/annonces?categorie=${categorie}` : `${baseUrl}/annonces`;
    const response = await fetch(url, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch annonces');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère une annonce par son ID
  static async getAnnonceById(token: string, id: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/${id}`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch annonce');
      throw new Error(message);
    }
    return await response.json();
  }

  // Crée une nouvelle annonce
  static async createAnnonce(token: string, data: any) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces`, {
      method: 'POST',
      headers: await this.getAuthHeaders(token),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to create annonce');
      throw new Error(message);
    }
    return await response.json();
  }

  // Crée une annonce Food Rescue (PARTENAIRE uniquement)
  static async createFoodRescueAnnonce(token: string, data: any) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/food-rescue`, {
      method: 'POST',
      headers: await this.getAuthHeaders(token),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to create food rescue annonce');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère mes annonces
  static async getMyAnnonces(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/mes-annonces`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch my annonces');
      throw new Error(message);
    }
    return await response.json();
  }

  // Met à jour une annonce
  static async updateAnnonce(token: string, annonceId: string, data: any) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/${annonceId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(token),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to update annonce');
      throw new Error(message);
    }
    return await response.json();
  }

  // Supprime une annonce
  static async deleteAnnonce(token: string, annonceId: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/${annonceId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to delete annonce');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère les annonces Food Rescue actives
  static async getFoodRescue(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/annonces/food-rescue`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch food rescue');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère les annonces à proximité d'une position
  static async getAnnoncesNearby(token: string, lat: number, lng: number, rayon?: number, categorie?: string) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/annonces/carte?lat=${lat}&lng=${lng}${rayon ? `&rayon=${rayon}` : ''}${categorie ? `&categorie=${categorie}` : ''}`;
    const response = await fetch(url, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch nearby annonces');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère mes transactions
  static async getMyTransactions(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/transactions/me`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch transactions');
      throw new Error(message);
    }
    return await response.json();
  }

  // Réserve une annonce
  static async reserveAnnonce(token: string, annonceId: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/transactions/reserve/${annonceId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to reserve');
      throw new Error(message);
    }
    return await response.json();
  }

  // Génère le QR code de réception
  static async getQRReception(token: string, transactionId: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/transactions/${transactionId}/qr-reception`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to generate QR');
      throw new Error(message);
    }
    return await response.json();
  }

  // Valide la réception avec le QR code
  static async validateReception(token: string, transactionId: string, secret: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/transactions/${transactionId}/validate-reception`, {
      method: 'POST',
      headers: await this.getAuthHeaders(token),
      body: JSON.stringify({ secret })
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to validate reception');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère le portefeuille utilisateur
  static async getWallet(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/wallet/me`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch wallet');
      throw new Error(message);
    }
    return await response.json();
  }

  // Dépose de l'argent dans le portefeuille
  static async depositMoney(token: string, montant: number) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/wallet/depot`, {
      method: 'POST',
      headers: await this.getAuthHeaders(token),
      body: JSON.stringify({ montant })
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to deposit');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère toutes les conversations
  static async getConversations(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/chat/conversations`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch conversations');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère l'historique d'une conversation
  static async getChatHistory(token: string, otherId: string, annonceId: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/chat/${otherId}/${annonceId}`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch chat history');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère tous les points relais
  static async getPointsRelais(token: string) {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/points-relais`, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch points relais');
      throw new Error(message);
    }
    return await response.json();
  }

  // Récupère les points relais à proximité
  static async getNearbyPointsRelais(token: string, lat: number, lng: number, rayon?: number) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/points-relais/nearby?lat=${lat}&lng=${lng}${rayon ? `&rayon=${rayon}` : ''}`;
    const response = await fetch(url, {
      headers: await this.getAuthHeaders(token)
    });
    if (!response.ok) {
      const message = await this.getErrorMessage(response, 'Failed to fetch nearby points');
      throw new Error(message);
    }
    return await response.json();
  }
}
