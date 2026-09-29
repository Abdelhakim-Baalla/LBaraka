import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

function statutTone(statut?: string): 'gold' | 'info' | 'primary' | 'success' | 'danger' | 'muted' {
  if (statut === 'EN_ATTENTE_RECEPTION') return 'gold';
  if (statut === 'EN_COURS') return 'info';
  if (statut === 'EN_ATTENTE_RETOUR') return 'primary';
  if (statut === 'TERMINEE') return 'success';
  if (statut === 'ANNULEE') return 'danger';
  return 'muted';
}

export default function AdminTransactions() {
  const router = useRouter();
  const { c } = useTheme();
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

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement des transactions...
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Enter index={0}>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableScale
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={c.ink} />
          </PressableScale>
          <View style={{ flex: 1 }}>
            <T kind="overline" color={c.primary}>Console admin</T>
            <T kind="h2" style={{ marginTop: 2 }}>Transactions</T>
          </View>
          <Tag label={`${transactions.length} dossiers`} tone="info" />
        </View>
      </Enter>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        style={{ marginTop: 16 }}
      >
        <Enter index={1}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={22} color={c.onPrimarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="h1">{String(transactions.length)}</T>
              <T kind="small" color={c.muted}>Transactions enregistrées</T>
            </View>
            <Tag label="Registre" tone="info" />
          </Card>
        </Enter>

        <Enter index={2}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Historique complet" action="Actualiser" onAction={onRefresh} />
          </View>
        </Enter>

        {transactions.length === 0 ? (
          <Enter index={3}>
            <Card style={{ marginTop: 12 }}>
              <EmptyState
                icon="swap-horizontal-outline"
                title="Aucune transaction"
                body="Aucune transaction enregistrée pour le moment."
              />
            </Card>
          </Enter>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            {transactions.map((transaction, index) => (
              <Enter key={transaction.id} index={Math.min(index, 6)}>
                <Card pad={16} style={{ flexDirection: 'row', gap: 12 }}>
                  <View
                    style={{
                      width: 6,
                      borderRadius: radius.pill,
                      backgroundColor: c.surface2,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <T kind="bodyStrong" numberOfLines={1}>
                          {transaction.annonce?.titre || 'Transaction'}
                        </T>
                        <T kind="caption" color={c.muted} style={{ marginTop: 4 }}>
                          ID: {String(transaction.id).substring(0, 8)}...
                        </T>
                      </View>
                      <Tag label={String(transaction.statut).replace(/_/g, ' ')} tone={statutTone(transaction.statut)} />
                    </View>

                    <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginTop: 12, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <T kind="small" color={c.muted}>Emprunteur</T>
                        <T kind="small" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                          {transaction.emprunteur?.email}
                        </T>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <T kind="small" color={c.muted}>Prêteur</T>
                        <T kind="small" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                          {transaction.preteur?.email}
                        </T>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="wallet-outline" size={15} color={c.gold} />
                        <T kind="small">{transaction.montantCautionBloquee} MAD</T>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar-outline" size={15} color={c.muted} />
                        <T kind="small" color={c.muted}>
                          {transaction.dateDebut ? new Date(transaction.dateDebut).toLocaleDateString('fr-FR') : 'N/A'}
                        </T>
                      </View>
                    </View>
                  </View>
                </Card>
              </Enter>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
