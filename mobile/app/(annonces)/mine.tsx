import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';

export default function MyAnnoncesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const loadMyAnnonces = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getMyAnnonces(token);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('My annonces load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMyAnnonces();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMyAnnonces();
  };

  const deleteAnnonce = async (annonceId: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(annonceId);
            const token = await AsyncStorage.getItem('accessToken');

            if (!token) {
              router.replace('/(auth)/sign-in');
              return;
            }

            await ApiService.deleteAnnonce(token, annonceId);
            await loadMyAnnonces();
          } catch (error: any) {
            Alert.alert('Erreur', error?.message || 'Suppression impossible.');
          } finally {
            setDeletingId('');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 10 }}>
      <View className="px-4 mb-4">
        <View className="bg-white rounded-2xl p-4 border border-outline-variant">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-extrabold text-primary">Mes annonces</Text>
              <Text className="text-sm text-on-surface-variant mt-1">Gérez vos annonces publiées.</Text>
            </View>
            <Pressable onPress={() => router.push('/(annonces)/create')} className="bg-primary px-3 py-2 rounded-lg">
              <Text className="text-white font-bold text-xs">+ Créer</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {annonces.length === 0 ? (
          <View className="bg-white border border-outline-variant rounded-2xl p-6 items-center">
            <Ionicons name="albums-outline" size={30} color="#A5A6AA" />
            <Text className="text-on-surface-variant mt-2">Vous n'avez pas encore d'annonce.</Text>
          </View>
        ) : (
          annonces.map((annonce) => (
            <View key={annonce.id} className="bg-white border border-outline-variant rounded-2xl p-3 mb-3">
              <Pressable onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                <Image
                  source={{ uri: annonce.photos?.[0] || 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=70' }}
                  className="w-full h-36 rounded-xl mb-3"
                  resizeMode="cover"
                />
                <Text className="text-base font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
                <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>{annonce.description}</Text>
              </Pressable>

              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => router.push(`/(annonces)/edit/${annonce.id}`)}
                  className="flex-1 bg-primary rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-bold text-xs">Modifier</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteAnnonce(annonce.id)}
                  disabled={deletingId === annonce.id}
                  className={`flex-1 rounded-xl py-3 items-center ${deletingId === annonce.id ? 'bg-error/60' : 'bg-error'}`}
                >
                  {deletingId === annonce.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-xs">Supprimer</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
