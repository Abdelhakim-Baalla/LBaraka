// =============================================================================
// (tabs)/_layout.tsx - Navigation par onglets en bas de l'écran
// =============================================================================

import { Tabs } from 'expo-router';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Couleur de la barre d'onglets
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        
        // Style de la barre d'onglets
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        
        // Style des headers pour chaque onglet
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textWhite,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Onglet Accueil - Liste des annonces */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
        }}
      />

      {/* Onglet Créer une annonce */}
      <Tabs.Screen
        name="create"
        options={{
          title: 'Nouvelle annonce',
          tabBarLabel: 'Créer',
        }}
      />

      {/* Onglet Wallet */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Mon Wallet',
          tabBarLabel: 'Wallet',
        }}
      />

      {/* Onglet Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mon Profil',
          tabBarLabel: 'Profil',
        }}
      />
    </Tabs>
  );
}
