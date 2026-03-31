import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ApiService } from '../../services/api';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAdminStats(token);
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    router.replace('/(auth)/sign-in');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#18192b] items-center justify-center">
        <ActivityIndicator size="large" color="#a259ec" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#18192b]" style={{ paddingTop: insets.top + 10 }}>
      {/* Bandeau ADMIN */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-[#23244a] border-b border-[#2d2e5e]">
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons name="shield-crown" size={28} color="#ffb300" />
          <Text className="text-lg font-extrabold text-[#ffb300] tracking-widest">ADMIN</Text>
        </View>
        <Pressable onPress={handleLogout} className="bg-[#2d2e5e] rounded-xl px-3 py-2 flex-row items-center gap-1">
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text className="text-xs text-white font-bold">Déconnexion</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a259ec" />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header Dashboard */}
        <Animated.View entering={FadeInUp.duration(500)} className="mt-6 mb-4">
          <Text className="text-2xl font-black text-white mb-1">Dashboard</Text>
          <Text className="text-sm text-[#a259ec] font-semibold">Gestion & Statistiques LBaraka</Text>
        </Animated.View>

        {/* Stats Overview */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#23244a] rounded-2xl p-5 shadow-lg border border-[#2d2e5e]">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="people" size={22} color="#ffb300" />
              <Text className="text-xs font-bold text-[#ffb300]">USERS</Text>
            </View>
            <Text className="text-2xl font-extrabold text-white">{stats?.overview?.totalUsers || 0}</Text>
            <Text className="text-xs text-[#a259ec] mt-1">Utilisateurs</Text>
          </View>
          <View className="flex-1 bg-[#23244a] rounded-2xl p-5 shadow-lg border border-[#2d2e5e]">
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="location" size={22} color="#a259ec" />
                <Text className="text-xs font-bold text-[#a259ec]">RELAIS</Text>
              </View>
              <Text className="text-2xl font-extrabold text-white">{stats?.overview?.totalPointsRelais || 0}</Text>
              <Text className="text-xs text-[#ffb300] mt-1">Points relais</Text>
            </View>
          </View>
        </View>

        {/* Impact & Financier */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-[#23244a] rounded-2xl p-5 shadow-lg border border-[#2d2e5e]">
            <View className="flex-row items-center justify-between mb-2">
              <MaterialCommunityIcons name="leaf" size={22} color="#00e676" />
              <Text className="text-xs font-bold text-[#00e676]">IMPACT</Text>
            </View>
            <Text className="text-xl font-extrabold text-white">{stats?.impact?.tonsFoodSaved || 0} T</Text>
            <Text className="text-xs text-[#a259ec] mt-1">Nourriture sauvée</Text>
          </View>
          <View className="flex-1 bg-[#23244a] rounded-2xl p-5 shadow-lg border border-[#2d2e5e]">
            <View className="flex-row items-center justify-between mb-2">
              <MaterialCommunityIcons name="cash-multiple" size={22} color="#ffb300" />
              <Text className="text-xs font-bold text-[#ffb300]">FINANCE</Text>
            </View>
            <Text className="text-xl font-extrabold text-white">{stats?.financial?.totalCirculatingMad || 0} MAD</Text>
            <Text className="text-xs text-[#a259ec] mt-1">En circulation</Text>
          </View>
        </View>

        {/* Activité récente */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-white mb-3">Activité récente</Text>
          {stats?.recentActivity?.length === 0 && (
            <View className="bg-[#23244a] rounded-xl p-6 items-center border border-[#2d2e5e]">
              <Ionicons name="time-outline" size={32} color="#a259ec" />
              <Text className="text-sm text-[#a259ec] mt-3">Aucune activité récente</Text>
            </View>
          )}
          {stats?.recentActivity?.map((item: any, idx: number) => (
            <Animated.View key={item.id} entering={FadeInUp.delay(100 + idx * 50).duration(600)} className="bg-[#23244a] rounded-xl p-4 mb-3 border border-[#2d2e5e] flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-white">{item.title}</Text>
                <Text className="text-xs text-[#a259ec]">{item.user}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-white">{item.status}</Text>
                <Ionicons name="chevron-forward" size={18} color="#a259ec" />
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
