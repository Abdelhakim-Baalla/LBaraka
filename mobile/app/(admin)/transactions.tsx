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

      const data = await ApiService.getAdminTransactions(token, 1, 50);
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
      EN_ATTENTE_RECEPTION: { bg: 'bg-[#d97721]/10', text: 'text-[#ffb783]', border: 'border-[#d97721]/20' },
      EN_COURS: { bg: 'bg-[#0566d9]/10', text: 'text-[#adc6ff]', border: 'border-[#0566d9]/20' },
      EN_ATTENTE_RETOUR: { bg: 'bg-[#8083ff]/10', text: 'text-[#c0c1ff]', border: 'border-[#8083ff]/20' },
      TERMINEE: { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', border: 'border-[#4ade80]/20' },
      ANNULEE: { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]', border: 'border-[#ffb4ab]/20' },
    };
    return colors[status] || { bg: 'bg-[#353534]', text: 'text-[#908fa0]', border: 'border-[#464554]' };
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
          <Text className="text-lg font-light text-[#e5e2e1]">Transaction Log</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c1ff" />}
      >
        {/* Stats */}
        <Animated.View entering={FadeInUp.duration(600)} className="bg-[#1c1b1b] p-8 rounded-sm mb-6 border border-[#464554]/10 border-l-2 border-l-[#adc6ff]">
          <View className="absolute top-0 right-0 p-4 opacity-10">
            <Ionicons name="swap-horizontal" size={60} color="#e5e2e1" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-6">Total Transactions</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-6xl font-light tracking-tighter text-[#e5e2e1]">{transactions.length}</Text>
            <Text className="text-sm font-medium text-[#adc6ff]">Recorded</Text>
          </View>
        </Animated.View>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <View className="bg-[#1c1b1b] rounded-sm items-center p-8 border border-[#464554]/10">
            <Ionicons name="swap-horizontal-outline" size={32} color="#908fa0" />
            <Text className="text-sm text-[#c7c4d7] mt-3">No transactions found</Text>
          </View>
        ) : (
          <View className="gap-4">
            {transactions.map((transaction, index) => {
              const statusColors = getStatusColor(transaction.statut);
              return (
                <Animated.View key={transaction.id} entering={FadeInUp.delay(100 + index * 50).duration(600)}>
                  <View className="bg-[#1c1b1b] hover:bg-[#201f1f] p-6 rounded-sm border border-[#464554]/10">
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-[#e5e2e1]" numberOfLines={1}>
                          {transaction.annonce?.titre || 'Transaction'}
                        </Text>
                        <Text className="text-xs text-[#908fa0] mt-1">
                          ID: {transaction.id.substring(0, 8)}...
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-sm ${statusColors.bg} border ${statusColors.border}`}>
                        <Text className={`text-[10px] font-bold uppercase ${statusColors.text}`}>
                          {transaction.statut.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-[#0e0e0e] rounded-sm p-4 mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-[#908fa0]">Emprunteur</Text>
                        <Text className="text-xs font-medium text-[#e5e2e1]">{transaction.emprunteur?.email}</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-[#908fa0]">Prêteur</Text>
                        <Text className="text-xs font-medium text-[#e5e2e1]">{transaction.preteur?.email}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-6">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="wallet" size={14} color="#ffb783" />
                        <Text className="text-xs text-[#c7c4d7]">{transaction.montantCautionBloquee} MAD</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="calendar" size={14} color="#908fa0" />
                        <Text className="text-xs text-[#c7c4d7]">
                          {new Date(transaction.dateDebut).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
