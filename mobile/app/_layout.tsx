// =============================================================================
// _layout.tsx RACINE - Configuration expo-router
// =============================================================================

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      {/* Barre de statut en haut - couleur principale */}
      <StatusBar style="light" backgroundColor={colors.primary} />
      
      {/* Navigation principale avec Stack Navigator */}
      <Stack
        screenOptions={{
          // Style de l'en-tête
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textWhite,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Écran d'accueil - redirige vers login ou tabs */}
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        
        {/* Écrans d'authentification */}
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
        
        {/* Écrans principaux (tabs) */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </>
  );
}
