import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';

export default function AdminAnnonces() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAnnonces();
    }, [])
  );

  const loadAnnonces = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnonces(token);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Error loading annonces:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnonces();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top + 10 }}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e3a8a" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} className="flex-row items-center gap-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white items-center justify-center shadow-sm border border-slate-200"
          >
            <Ionicons name="arrow-back" size={20} color="#1e3a8a" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-500">Administration</Text>
            <Text className="text-lg font-extrabold text-slate-900">Annonces</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-500">Total annonces</Text>
              <Text className="text-2xl font-extrabold text-slate-900 mt-1">{annonces.length}</Text>
            </View>
            <View className="bg-slate-100 rounded-full p-3">
              <Ionicons name="megaphone" size={24} color="#475569" />
            </View>
          </View>
        </Animated.View>

        {/* Annonces List */}
        {annonces.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-white rounded-xl p-6 items-center shadow-sm border border-slate-200">
            <Ionicons name="megaphone-outline" size={32} color="#94a3b8" />
            <Text className="text-sm text-slate-500 mt-3">Aucune annonce</Text>
          </Animated.View>
        ) : (
          annonces.map((annonce, index) => (
            <Animated.View key={annonce.id} entering={FadeInUp.delay(150 + index * 50).duration(600)}>
              <Pressable
                onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-200"
              >
                <View className="flex-row gap-3">
                  <SmartAnnonceImage
                    uri={annonce.photos?.[0]}
                    className="w-20 h-20 rounded-xl overflow-hidden"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                      {annonce.titre}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                      {annonce.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-blue-100 rounded-lg px-2 py-1">
                        <Text className="text-[10px] font-bold text-blue-900">{annonce.categorie}</Text>
                      </View>
                      <View className="bg-slate-100 rounded-lg px-2 py-1">
                        <Text className="text-[10px] font-bold text-slate-700">{annonce.statut}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
