import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/utilisateurs/profil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.utilisateur);
        await AsyncStorage.setItem('user', JSON.stringify(data.utilisateur));
      } else {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
              }
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('user');
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white/70 backdrop-blur-xl shadow-lg px-6 h-16 flex-row items-center justify-between">
        <Text className="text-xl font-bold tracking-widest text-primary">PROFILE</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        {user && (
          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <View className="items-center mb-4">
              <View className="w-20 h-20 rounded-full bg-primary-container items-center justify-center mb-3">
                <Text className="text-white text-3xl font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-xl font-bold text-primary mb-1">
                {user.profil?.prenom || user.profil?.nom 
                  ? `${user.profil?.prenom || ''} ${user.profil?.nom || ''}`.trim()
                  : 'Utilisateur'}
              </Text>
              <Text className="text-sm text-on-surface-variant mb-1">{user.email}</Text>
              <Text className="text-xs text-on-surface-variant">{user.telephone}</Text>
              {user.profil?.ville && (
                <Text className="text-xs text-on-surface-variant mt-1">
                  <Ionicons name="location-outline" size={12} /> {user.profil.ville}
                </Text>
              )}
            </View>

            {/* Stats */}
            <View className="flex-row justify-around pt-4 border-t border-outline-variant/20">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {user.profil?.lBarakaScore || 0}
                </Text>
                <Text className="text-xs text-on-surface-variant uppercase tracking-wider">
                  Points
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-secondary">
                  {user.profil?.palier || 'BRONZE'}
                </Text>
                <Text className="text-xs text-on-surface-variant uppercase tracking-wider">
                  Palier
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {user.profil?.badges?.length || 0}
                </Text>
                <Text className="text-xs text-on-surface-variant uppercase tracking-wider">
                  Badges
                </Text>
              </View>
            </View>

            {/* Additional Info - All Fields */}
            <View className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
              {user.profil?.cin && (
                <View className="flex-row items-center py-1">
                  <Ionicons name="card-outline" size={16} color="#717973" />
                  <Text className="text-sm text-on-surface-variant ml-2">CIN: {user.profil.cin}</Text>
                </View>
              )}
              
              {user.profil?.dateNaissance && (
                <View className="flex-row items-center py-1">
                  <Ionicons name="calendar-outline" size={16} color="#717973" />
                  <Text className="text-sm text-on-surface-variant ml-2">
                    Né(e) le: {new Date(user.profil.dateNaissance).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}
              
              {user.profil?.adresseComplete && (
                <View className="flex-row items-center py-1">
                  <Ionicons name="home-outline" size={16} color="#717973" />
                  <Text className="text-sm text-on-surface-variant ml-2" numberOfLines={2}>
                    {user.profil.adresseComplete}
                  </Text>
                </View>
              )}
              
              {user.profil?.langueInterface && (
                <View className="flex-row items-center py-1">
                  <Ionicons name="language-outline" size={16} color="#717973" />
                  <Text className="text-sm text-on-surface-variant ml-2">
                    Langue: {user.profil.langueInterface}
                  </Text>
                </View>
              )}
              
              {user.dateInscription && (
                <View className="flex-row items-center py-1">
                  <Ionicons name="time-outline" size={16} color="#717973" />
                  <Text className="text-sm text-on-surface-variant ml-2">
                    Membre depuis: {new Date(user.dateInscription).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}
              
              {user.emailVerified !== undefined && (
                <View className="flex-row items-center py-1">
                  <Ionicons 
                    name={user.emailVerified ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={user.emailVerified ? "#4caf50" : "#f44336"} 
                  />
                  <Text className="text-sm text-on-surface-variant ml-2">
                    Email {user.emailVerified ? 'vérifié' : 'non vérifié'}
                  </Text>
                </View>
              )}
              
              {user.telephoneVerified !== undefined && (
                <View className="flex-row items-center py-1">
                  <Ionicons 
                    name={user.telephoneVerified ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={user.telephoneVerified ? "#4caf50" : "#f44336"} 
                  />
                  <Text className="text-sm text-on-surface-variant ml-2">
                    Téléphone {user.telephoneVerified ? 'vérifié' : 'non vérifié'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <Pressable 
            onPress={() => router.push('/edit-profile')}
            className="flex-row items-center justify-between px-6 py-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={24} color="#012d1d" />
              <Text className="text-base font-semibold text-on-surface">
                Modifier le profil
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable 
            onPress={() => router.push('/(tabs)/wallet')}
            className="flex-row items-center justify-between px-6 py-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="wallet-outline" size={24} color="#012d1d" />
              <Text className="text-base font-semibold text-on-surface">
                Mon portefeuille
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between px-6 py-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={24} color="#012d1d" />
              <Text className="text-base font-semibold text-on-surface">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between px-6 py-4 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={24} color="#012d1d" />
              <Text className="text-base font-semibold text-on-surface">
                Paramètres
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          disabled={isLoading}
          className={`bg-error rounded-xl py-5 px-6 flex-row items-center justify-center shadow-lg mb-8 ${
            isLoading ? 'opacity-50' : ''
          }`}
        >
          <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          <Text className="text-white font-bold text-lg tracking-wide ml-3">
            {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
          </Text>
        </Pressable>

        {/* App Info */}
        <View className="items-center pb-8 opacity-50">
          <Text className="text-xs text-on-surface-variant">LBaraka v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Decorative Elements */}
      <View className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
      <View className="absolute top-20 -right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
    </View>
  );
}
