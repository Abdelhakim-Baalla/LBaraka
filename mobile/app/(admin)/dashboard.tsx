import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
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
      <View className="flex-1 bg-[#0e0e0e] items-center justify-center">
        <ActivityIndicator size="large" color="#c0c1ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0e0e0e]" style={{ paddingTop: insets.top }}>
      {/* TopAppBar */}
      <View className="bg-[#131313] border-b border-[#464554]/20 px-6 h-16 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-sm bg-gradient-to-br from-[#c0c1ff] to-[#8083ff] items-center justify-center">
            <MaterialCommunityIcons name="terminal" size={20} color="#1000a9" />
          </View>
          <Text className="text-xl font-light tracking-tighter text-[#e5e2e1]">
            LBARAKA <Text className="font-bold text-[#c0c1ff]">COMMAND</Text>
          </Text>
        </View>
        <Pressable onPress={handleLogout} className="w-10 h-10 items-center justify-center hover:bg-[#353534] rounded-sm">
          <Ionicons name="log-out-outline" size={20} color="#c0c1ff" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c1ff" />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 128 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} className="mb-6">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c0c1ff]/80 mb-1">Architecture Overview</Text>
          <Text className="text-3xl font-light text-[#e5e2e1]">Global Metrics</Text>
        </Animated.View>

        {/* Stats Grid */}
        <View className="gap-4 mb-12">
          {/* Active Users */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-[#2a2a2a] p-6 rounded-sm border-l-2 border-[#c0c1ff] relative overflow-hidden">
            <View className="absolute top-0 right-0 p-2 opacity-10">
              <Ionicons name="person" size={60} color="#e5e2e1" />
            </View>
            <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-4">Active Users</Text>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-4xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalUsers || 0}</Text>
              <Text className="text-xs font-medium text-[#c0c1ff]">Total</Text>
            </View>
            <View className="h-1 w-full bg-[#0e0e0e] rounded-full overflow-hidden">
              <View className="h-full bg-gradient-to-r from-[#c0c1ff] to-[#8083ff]" style={{ width: '75%' }} />
            </View>
          </Animated.View>

          {/* Transactions */}
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-[#2a2a2a] p-6 rounded-sm relative overflow-hidden">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-4">Transactions</Text>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-4xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalTransactions || 0}</Text>
              <Text className="text-xs font-medium text-[#c0c1ff]">Total</Text>
            </View>
            <View className="flex-row items-end gap-1 h-8">
              <View className="w-1 bg-[#c0c1ff]/20 h-3" />
              <View className="w-1 bg-[#c0c1ff]/40 h-5" />
              <View className="w-1 bg-[#c0c1ff]/60 h-8" />
              <View className="w-1 bg-[#c0c1ff] h-6" />
              <View className="w-1 bg-[#c0c1ff]/80 h-4" />
              <View className="w-1 bg-[#c0c1ff]/40 h-7" />
            </View>
          </Animated.View>

          {/* Food Saved */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} className="bg-[#2a2a2a] p-6 rounded-sm relative overflow-hidden">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-4">Food Saved (KG)</Text>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-4xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.impact?.tonsFoodSaved || 0}</Text>
              <Text className="text-xs font-medium text-[#ffb783]">Tonnes</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="trending-up" size={14} color="#ffb783" />
              <Text className="text-[10px] text-[#908fa0]">Impact environnemental positif</Text>
            </View>
          </Animated.View>

          {/* Points Relais */}
          <Animated.View entering={FadeInUp.delay(250).duration(600)} className="bg-[#2a2a2a] p-6 rounded-sm relative overflow-hidden">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-4">Points Relais</Text>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-4xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalPointsRelais || 0}</Text>
              <Text className="text-xs font-medium text-[#c7c4d7]">Actifs</Text>
            </View>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <View className="mb-12">
          <View className="flex-row items-center gap-4 mb-6">
            <Text className="text-lg font-medium text-[#e5e2e1]">Quick Actions</Text>
            <View className="h-px flex-1 bg-[#464554]/20" />
          </View>
          <View className="gap-3">
            <Pressable
              onPress={() => router.push('/(admin)/users')}
              className="bg-[#1c1b1b] border border-[#464554]/10 p-5 rounded-sm flex-row items-center gap-4"
            >
              <View className="w-10 h-10 rounded-sm bg-[#c0c1ff]/10 items-center justify-center">
                <Ionicons name="people" size={20} color="#c0c1ff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-[#e5e2e1]">Gérer les utilisateurs</Text>
                <Text className="text-xs text-[#908fa0] mt-1">Voir tous les comptes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#908fa0" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(admin)/transactions')}
              className="bg-[#1c1b1b] border border-[#464554]/10 p-5 rounded-sm flex-row items-center gap-4"
            >
              <View className="w-10 h-10 rounded-sm bg-[#adc6ff]/10 items-center justify-center">
                <Ionicons name="swap-horizontal" size={20} color="#adc6ff" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-[#e5e2e1]">Transactions</Text>
                <Text className="text-xs text-[#908fa0] mt-1">Historique complet</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#908fa0" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(admin)/annonces')}
              className="bg-[#1c1b1b] border border-[#464554]/10 p-5 rounded-sm flex-row items-center gap-4"
            >
              <View className="w-10 h-10 rounded-sm bg-[#ffb783]/10 items-center justify-center">
                <Ionicons name="megaphone" size={20} color="#ffb783" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-[#e5e2e1]">Annonces</Text>
                <Text className="text-xs text-[#908fa0] mt-1">Toutes les publications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#908fa0" />
            </Pressable>
          </View>
        </View>

        {/* Floating Button - Voir l'app */}
        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          className="absolute bottom-8 right-6 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full w-14 h-14 items-center justify-center shadow-lg"
          style={{ shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
        >
          <Ionicons name="apps" size={24} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
