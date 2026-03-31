import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        {/* Header Admin */}
        <Animated.View entering={FadeInUp.duration(500)} className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-5 mb-4 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-blue-200">Panneau Administrateur</Text>
              <Text className="text-xl font-extrabold text-white mt-1">Dashboard</Text>
            </View>
            <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center">
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
          </View>
          <Text className="text-xs text-blue-100">
            Gérez la plateforme LBaraka en temps réel
          </Text>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">Vue d'ensemble</Text>
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="people" size={20} color="#1e3a8a" />
                <View className="bg-blue-100 rounded-lg px-2 py-1">
                  <Text className="text-[10px] font-bold text-blue-900">USERS</Text>
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{stats?.overview?.totalUsers || 0}</Text>
              <Text className="text-xs text-slate-500 mt-1">Utilisateurs</Text>
            </View>

            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="location" size={20} color="#f97316" />
                <View className="bg-orange-100 rounded-lg px-2 py-1">
                  <Text className="text-[10px] font-bold text-orange-900">RELAIS</Text>
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">{stats?.overview?.totalPointsRelais || 0}</Text>
              <Text className="text-xs text-slate-500 mt-1">Points relais</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <View className="flex-row items-center justify-between mb-3">
              <Ionicons name="swap-horizontal" size={20} color="#10b981" />
              <View className="bg-green-100 rounded-lg px-2 py-1">
                <Text className="text-[10px] font-bold text-green-900">TRANSACTIONS</Text>
              </View>
            </View>
            <Text className="text-2xl font-extrabold text-slate-900">{stats?.overview?.transactionsCount || 0}</Text>
            <Text className="text-xs text-slate-500 mt-1">Transactions terminées</Text>
          </View>
        </Animated.View>

        {/* Impact Stats */}
        <Animated.View entering={FadeInUp.delay(150).duration(600)} className="mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">Impact Social</Text>
          <View className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg mb-3">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="leaf" size={20} color="#fff" />
              </View>
              <Text className="text-base font-bold text-white">Food Rescue</Text>
            </View>
            <Text className="text-3xl font-extrabold text-white">{stats?.impact?.tonsFoodSaved || 0} T</Text>
            <Text className="text-xs text-green-100 mt-1">Nourriture sauvée</Text>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <Ionicons name="cloud-outline" size={18} color="#64748b" />
              <Text className="text-xl font-extrabold text-slate-900 mt-2">{stats?.impact?.co2PreventedKg || 0} kg</Text>
              <Text className="text-xs text-slate-500 mt-1">CO2 évité</Text>
            </View>

            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <Ionicons name="heart-outline" size={18} color="#64748b" />
              <Text className="text-xl font-extrabold text-slate-900 mt-2">{stats?.impact?.totalPeopleHelped || 0}</Text>
              <Text className="text-xs text-slate-500 mt-1">Personnes aidées</Text>
            </View>
          </View>
        </Animated.View>

        {/* Financial Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">Finances</Text>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="wallet" size={20} color="#1e3a8a" />
                </View>
                <Text className="text-sm font-bold text-slate-700">Portefeuilles</Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-slate-500 mb-1">Solde total en circulation</Text>
              <Text className="text-2xl font-extrabold text-blue-900">{stats?.financial?.totalCirculatingMad || 0} MAD</Text>
            </View>

            <View className="pt-3 border-t border-slate-200">
              <Text className="text-xs text-slate-500 mb-1">Montant bloqué (cautions)</Text>
              <Text className="text-xl font-bold text-orange-600">{stats?.financial?.currentlyLockedMad || 0} MAD</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250).duration(600)} className="mb-4">
            <Text className="text-sm font-bold text-slate-700 mb-3">Activité récente</Text>
            {stats.recentActivity.map((activity: any, index: number) => (
              <View key={index} className="bg-white rounded-xl p-4 mb-2 shadow-sm border border-slate-200">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{activity.title}</Text>
                    <Text className="text-xs text-slate-500 mt-1">{activity.user}</Text>
                  </View>
                  <View className="bg-slate-100 rounded-lg px-2 py-1">
                    <Text className="text-[10px] font-bold text-slate-700">{activity.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} className="mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-3">Actions rapides</Text>
          <View className="flex-row gap-2 mb-2">
            <Pressable
              onPress={() => router.push('/(admin)/users')}
              className="flex-1 bg-blue-900 rounded-xl p-4 shadow-md"
            >
              <Ionicons name="people" size={24} color="#fff" />
              <Text className="text-sm font-bold text-white mt-2">Utilisateurs</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(admin)/transactions')}
              className="flex-1 bg-orange-600 rounded-xl p-4 shadow-md"
            >
              <Ionicons name="swap-horizontal" size={24} color="#fff" />
              <Text className="text-sm font-bold text-white mt-2">Transactions</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/(admin)/annonces')}
              className="flex-1 bg-slate-700 rounded-xl p-4 shadow-md"
            >
              <Ionicons name="megaphone" size={24} color="#fff" />
              <Text className="text-sm font-bold text-white mt-2">Annonces</Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              className="flex-1 bg-red-600 rounded-xl p-4 shadow-md"
            >
              <Ionicons name="log-out" size={24} color="#fff" />
              <Text className="text-sm font-bold text-white mt-2">Déconnexion</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* App Button */}
      <Animated.View
        entering={FadeInLeft.delay(500).duration(600)}
        className="absolute bottom-20 left-4"
        style={{ paddingBottom: insets.bottom }}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          className="bg-emerald-600 rounded-full p-4 shadow-lg flex-row items-center gap-2"
        >
          <Ionicons name="apps" size={20} color="#fff" />
          <Text className="text-white font-bold text-xs">Voir l'app</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
