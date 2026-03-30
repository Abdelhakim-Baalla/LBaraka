import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';

export default function FoodRescueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFoodRescue = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getFoodRescue(token);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Food rescue load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadFoodRescue();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFoodRescue();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Food Rescue</Text>
          <Ionicons name="restaurant-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">Repas et invendus à récupérer rapidement dans votre quartier.</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {annonces.length === 0 ? (
          <View className="bg-white border border-outline-variant rounded-2xl p-6 items-center">
            <Ionicons name="restaurant-outline" size={28} color="#A5A6AA" />
            <Text className="text-on-surface-variant mt-2">Aucun Food Rescue actif maintenant.</Text>
          </View>
        ) : (
          annonces.map((annonce) => (
            <Pressable
              key={annonce.id}
              onPress={() => router.push(`/(annonces)/${annonce.id}`)}
              className="bg-white border border-outline-variant rounded-2xl p-3 mb-3"
            >
              <SmartAnnonceImage
                uri={annonce.photos?.[0]}
                className="w-full h-40 rounded-xl mb-3 overflow-hidden"
                resizeMode="cover"
              />
              <Text className="text-base font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
              <Text className="text-sm text-on-surface-variant mt-1" numberOfLines={2}>{annonce.description}</Text>

              <View className="flex-row flex-wrap gap-2 mt-2">
                <View className="bg-primary/10 px-2 py-1 rounded-lg">
                  <Text className="text-[10px] text-primary font-semibold">{annonce.condition || 'BON_ETAT'}</Text>
                </View>
                <View className="bg-surface-container px-2 py-1 rounded-lg">
                  <Text className="text-[10px] text-on-surface-variant">
                    Expire: {annonce.dateExpiration ? new Date(annonce.dateExpiration).toLocaleString('fr-FR') : 'Bientôt'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <View className="bg-primary/10 px-2 py-1 rounded-lg">
                  <Text className="text-xs font-semibold text-primary">Expire bientôt</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#1B4332" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
