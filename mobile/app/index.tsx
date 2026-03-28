// =============================================================================
// index.tsx - Redirige vers login ou home selon si l'utilisateur est connecté
// =============================================================================

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Au démarrage, on vérifie si l'utilisateur a un token
    const verifierAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // Si token existe → aller à home (tabs)
        router.replace('/(tabs)');
      } else {
        // Pas de token → aller à login
        router.replace('/(auth)/login');
      }
    };

    verifierAuth();
  }, []);

  // Écran de chargement pendant la vérification
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: colors.background 
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
