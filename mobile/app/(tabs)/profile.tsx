import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';
import { ApiService } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  // Charge les données utilisateur
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

      try {
        const data = await ApiService.getUserProfile(token);
        setUser(data.utilisateur);
        await AsyncStorage.setItem('user', JSON.stringify(data.utilisateur));
      } catch {
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

  // Gère la déconnexion
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
                await ApiService.logout(token);
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
      <View
        className="bg-white/90 px-6 pb-4 border-b border-outline-variant/30"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-on-surface-variant">Espace personnel</Text>
            <Text className="text-xl font-extrabold text-primary">Mon Profil</Text>
          </View>
          <Pressable className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="#1B4332" />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 px-6 pt-5 pb-5 justify-between">
        <View>

          {user && (
            <View className="bg-white rounded-2xl p-4 border border-outline-variant/70 mb-5">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-14 h-14 rounded-full bg-primary-container items-center justify-center">
                  <Text className="text-white text-xl font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                    {user.profil?.prenom || user.profil?.nom
                      ? `${user.profil?.prenom || ''} ${user.profil?.nom || ''}`.trim()
                      : 'Utilisateur'}
                  </Text>
                  <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{user.email}</Text>
                  <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{user.telephone}</Text>
                </View>
              </View>

              <View className="flex-row justify-between gap-2 pt-3 border-t border-outline-variant/20">
                <View className="items-center bg-surface-container rounded-xl py-2.5 flex-1">
                  <Text className="text-lg font-bold text-primary">{user.profil?.lBarakaScore || 0}</Text>
                  <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Points</Text>
                </View>
                <View className="items-center bg-surface-container rounded-xl py-2.5 flex-1">
                  <Text className="text-lg font-bold text-secondary" numberOfLines={1}>{user.profil?.palier || 'BRONZE'}</Text>
                  <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Palier</Text>
                </View>
                <View className="items-center bg-surface-container rounded-xl py-2.5 flex-1">
                  <Text className="text-lg font-bold text-primary">{user.profil?.badges?.length || 0}</Text>
                  <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Badges</Text>
                </View>
              </View>
            </View>
          )}

          <View className="bg-primary rounded-2xl p-3.5 mb-5 flex-row items-center gap-3">
            <Ionicons name="leaf-outline" size={20} color="#ffffff" />
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Impact personnel</Text>
              <Text className="text-white/85 text-[11px]">Continuez vos échanges pour progresser.</Text>
            </View>
          </View>


          <View className="bg-white rounded-2xl border border-outline-variant/70 overflow-hidden">
          <Pressable 
            onPress={() => router.push('/edit-profile')}
            className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={21} color="#012d1d" />
              <Text className="text-sm font-semibold text-on-surface">
                Modifier le profil
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable 
            onPress={() => router.push('/(tabs)/wallet')}
            className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="wallet-outline" size={21} color="#012d1d" />
              <Text className="text-sm font-semibold text-on-surface">
                Mon portefeuille
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(annonces)/mine')}
            className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="albums-outline" size={21} color="#012d1d" />
              <Text className="text-sm font-semibold text-on-surface">
                Mes annonces
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={21} color="#012d1d" />
              <Text className="text-sm font-semibold text-on-surface">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between px-5 py-4 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={21} color="#012d1d" />
              <Text className="text-sm font-semibold text-on-surface">
                Paramètres
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#717973" />
          </Pressable>
        </View>
        </View>

        <View>
          <Pressable
            onPress={handleLogout}
            disabled={isLoading}
            className={`bg-error rounded-xl py-4 px-6 flex-row items-center justify-center shadow-lg ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
            <Text className="text-white font-bold text-base tracking-wide ml-2.5">
              {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
            </Text>
          </Pressable>

          <View className="items-center pt-3 opacity-50">
            <Text className="text-xs text-on-surface-variant">LBaraka v1.0.0</Text>
          </View>
        </View>
      </View>


      <View className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
      <View className="absolute top-20 -right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
    </View>
  );
}
