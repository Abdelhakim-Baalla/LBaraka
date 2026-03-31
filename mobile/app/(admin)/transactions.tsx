import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';

export default function AdminTransactions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getMyTransactions(token);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      EN_ATTENTE_RECEPTION: 'bg-amber-100 text-amber-800',
      EN_COURS: 'bg-blue-100 text-blue-800',
      EN_ATTENTE_RETOUR: 'bg-purple-100 text-purple-800',
      TERMINEE: 'bg-green-100 text-green-800',
      ANNULEE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
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
            <Text className="text-lg font-extrabold text-slate-900">Transactions</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-500">Total transactions</Text>
              <Text className="text-2xl font-extrabold text-orange-600 mt-1">{transactions.length}</Text>
            </View>
            <View className="bg-orange-100 rounded-full p-3">
              <Ionicons name="swap-horizontal" size={24} color="#f97316" />
            </View>
          </View>
        </Animated.View>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-white rounded-xl p-6 items-center shadow-sm border border-slate-200">
            <Ionicons name="swap-horizontal-outline" size={32} color="#94a3b8" />
            <Text className="text-sm text-slate-500 mt-3">Aucune transaction</Text>
          </Animated.View>
        ) : (
          transactions.map((transaction, index) => (
            <Animated.View key={transaction.id} entering={FadeInUp.delay(150 + index * 50).duration(600)}>
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-200">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                      {transaction.annonce?.titre || 'Annonce'}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1">
                      ID: {transaction.id.substring(0, 8)}...
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-lg ${getStatusColor(transaction.statut)}`}>
                    <Text className={`text-[10px] font-bold ${getStatusColor(transaction.statut).split(' ')[1]}`}>
                      {transaction.statut}
                    </Text>
                  </View>
                </View>

                <View className="bg-slate-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-slate-500">Emprunteur</Text>
                    <Text className="text-xs font-bold text-slate-900">{transaction.emprunteur?.email}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Prêteur</Text>
                    <Text className="text-xs font-bold text-slate-900">{transaction.preteur?.email}</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="wallet" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-600">{transaction.montantCautionBloquee} MAD</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-600">
                      {new Date(transaction.dateDebut).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
