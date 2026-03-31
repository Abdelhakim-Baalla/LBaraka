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

      const data = await ApiService.getAdminAnnonces(token, 1, 50);
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

  const getStatusColor = (status: string) => {
    const colors: any = {
      DISPONIBLE: { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', border: 'border-[#4ade80]/20' },
      EMPRUNTEE: { bg: 'bg-[#adc6ff]/10', text: 'text-[#adc6ff]', border: 'border-[#adc6ff]/20' },
      INDISPONIBLE: { bg: 'bg-[#908fa0]/10', text: 'text-[#908fa0]', border: 'border-[#908fa0]/20' },
    };
    return colors[status] || { bg: 'bg-[#353534]', text: 'text-[#c7c4d7]', border: 'border-[#464554]' };
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0e0e0e] items-center justify-center">
        <ActivityIndicator size="large" color="#c0c1ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0e0e0e]" style={{ paddingTop: insets.top }}>
      {/* TopAppBar */}
      <View className="bg-[#131313] border-b border-[#464554]/20 px-6 h-16 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center hover:bg-[#353534] rounded-sm">
          <Ionicons name="arrow-back" size={20} color="#c0c1ff" />
        </Pressable>
        <View className="flex-1 ml-3">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c0c1ff]/80">System Oversight</Text>
          <Text className="text-lg font-light text-[#e5e2e1]">Annonces Registry</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c1ff" />}
      >
        {/* Stats */}
        <Animated.View entering={FadeInUp.duration(600)} className="bg-[#1c1b1b] p-8 rounded-sm mb-6 border border-[#464554]/10">
          <View className="absolute top-0 right-0 p-4 opacity-10">
            <Ionicons name="megaphone" size={60} color="#e5e2e1" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-6">Total Annonces</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-6xl font-light tracking-tighter text-[#e5e2e1]">{annonces.length}</Text>
            <Text className="text-sm font-medium text-[#c0c1ff]">Published</Text>
          </View>
        </Animated.View>

        {/* Annonces List */}
        {annonces.length === 0 ? (
          <View className="bg-[#1c1b1b] rounded-sm items-center p-8 border border-[#464554]/10">
            <Ionicons name="megaphone-outline" size={32} color="#908fa0" />
            <Text className="text-sm text-[#c7c4d7] mt-3">No annonces found</Text>
          </View>
        ) : (
          <View className="gap-4">
            {annonces.map((annonce, index) => {
              const statusColors = getStatusColor(annonce.statut);
              return (
                <Animated.View key={annonce.id} entering={FadeInUp.delay(100 + index * 50).duration(600)}>
                  <Pressable
                    onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                    className="bg-[#1c1b1b] hover:bg-[#201f1f] p-6 rounded-sm border border-[#464554]/10"
                  >
                    <View className="flex-row gap-4">
                      <SmartAnnonceImage
                        uri={annonce.photos?.[0]}
                        className="w-20 h-20 rounded-sm overflow-hidden border border-[#464554]/30"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text className="text-base font-medium text-[#e5e2e1]" numberOfLines={1}>
                          {annonce.titre}
                        </Text>
                        <Text className="text-xs text-[#908fa0] mt-1" numberOfLines={2}>
                          {annonce.description}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-3">
                          <View className="bg-[#0566d9]/10 rounded-sm px-2 py-1 border border-[#0566d9]/20">
                            <Text className="text-[10px] font-bold text-[#adc6ff] uppercase">{annonce.categorie}</Text>
                          </View>
                          <View className={`rounded-sm px-2 py-1 ${statusColors.bg} border ${statusColors.border}`}>
                            <Text className={`text-[10px] font-bold uppercase ${statusColors.text}`}>{annonce.statut}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
