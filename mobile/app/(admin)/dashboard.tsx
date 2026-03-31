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
            <Ionicons name="shield" size={20} color="#1000a9" />
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
        <View className="mb-12">
          {/* Overview Section */}
          <Text className="text-xs font-semibold text-[#c0c1ff] mb-3 uppercase tracking-wide">Overview</Text>
          <View className="flex-row gap-3 mb-3">
              <Animated.View entering={FadeInUp.delay(100).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm border-l-2 border-[#c0c1ff]">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Total Users</Text>
                <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalUsers || 0}</Text>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(150).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Points Relais</Text>
                <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalPointsRelais || 0}</Text>
              </Animated.View>
          </View>
          <View className="flex-row gap-3 mb-8">
              <Animated.View entering={FadeInUp.delay(200).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Transactions</Text>
                <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.overview?.totalTransactions || 0}</Text>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(250).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Terminées</Text>
                <Text className="text-3xl font-extralight tracking-tight text-[#4ade80]">{stats?.overview?.transactionsCount || 0}</Text>
              </Animated.View>
          </View>

          {/* Impact Section */}
          <Text className="text-xs font-semibold text-[#ffb783] mb-3 uppercase tracking-wide">Impact</Text>
          <View className="flex-row gap-3 mb-3">
              <Animated.View entering={FadeInUp.delay(300).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm relative overflow-hidden">
                <View className="absolute top-0 right-0 p-2 opacity-10"><Ionicons name="leaf" size={40} color="#ffb783" /></View>
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Food Saved</Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.impact?.tonsFoodSaved || 0}</Text>
                  <Text className="text-[10px] font-medium text-[#ffb783]">Tons</Text>
                </View>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(350).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm relative overflow-hidden">
                <View className="absolute top-0 right-0 p-2 opacity-10"><Ionicons name="cloud" size={40} color="#ffb783" /></View>
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">CO2 Prev</Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.impact?.co2PreventedKg || 0}</Text>
                  <Text className="text-[10px] font-medium text-[#ffb783]">KG</Text>
                </View>
              </Animated.View>
          </View>
          <Animated.View entering={FadeInUp.delay(400).duration(600)} className="bg-[#2a2a2a] p-5 rounded-sm mb-8 flex-row items-center justify-between">
            <View>
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">People Helped</Text>
                <Text className="text-3xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.impact?.totalPeopleHelped || 0}</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-[#ffb783]/10 items-center justify-center">
                <Ionicons name="heart" size={24} color="#ffb783" />
            </View>
          </Animated.View>

          {/* Financial Section */}
          <Text className="text-xs font-semibold text-[#4ade80] mb-3 uppercase tracking-wide">Financial</Text>
          <View className="flex-row gap-3">
              <Animated.View entering={FadeInUp.delay(450).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm border-b-2 border-[#4ade80]">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Circulating MAD</Text>
                <Text className="text-2xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.financial?.totalCirculatingMad?.toLocaleString() || 0}</Text>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(500).duration(600)} className="flex-1 bg-[#2a2a2a] p-5 rounded-sm border-b-2 border-[#ffb4ab]">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-2">Locked MAD</Text>
                <Text className="text-2xl font-extralight tracking-tight text-[#e5e2e1]">{stats?.financial?.currentlyLockedMad?.toLocaleString() || 0}</Text>
              </Animated.View>
          </View>
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
