import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
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
                {user.profil?.nom || user.profil?.prenom 
                  ? `${user.profil?.prenom || ''} ${user.profil?.nom || ''}`.trim()
                  : 'Nom et prénom non renseignés'}
              </Text>
              <Text className="text-sm text-on-surface-variant">{user.email}</Text>
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
          </View>
        )}

        {/* Menu Items */}
        <View className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <Pressable className="flex-row items-center justify-between px-6 py-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={24} color="#012d1d" />
              <Text className="text-base font-semibold text-on-surface">
                Modifier le profil
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between px-6 py-4 border-b border-outline-variant/10 active:bg-surface-container-low">
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
