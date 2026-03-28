// =============================================================================
// (auth)/_layout.tsx - Layout pour les écrans d'authentification
// =============================================================================

import { Stack } from 'expo-router';
import { colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
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
      {/* Écran de connexion */}
      <Stack.Screen 
        name="login" 
        options={{ title: 'Connexion' }} 
      />
      
      {/* Écran d'inscription */}
      <Stack.Screen 
        name="register" 
        options={{ title: 'Créer un compte' }} 
      />
    </Stack>
  );
}
