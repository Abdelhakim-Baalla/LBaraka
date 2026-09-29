import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

export default function AdminDashboard() {
  const router = useRouter();
  const { c } = useTheme();
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
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement des statistiques...
          </T>
        </View>
      </Screen>
    );
  }

  const overview: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Total utilisateurs', value: stats?.overview?.totalUsers || 0, icon: 'people-outline' },
    { label: 'Points relais', value: stats?.overview?.totalPointsRelais || 0, icon: 'storefront-outline' },
    { label: 'Transactions', value: stats?.overview?.totalTransactions || 0, icon: 'swap-horizontal-outline' },
    { label: 'Terminées', value: stats?.overview?.transactionsCount || 0, icon: 'checkmark-circle-outline' },
  ];

  const impact: { label: string; value: string | number; unit: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Nourriture sauvée', value: stats?.impact?.tonsFoodSaved || 0, unit: 'Tonnes', icon: 'leaf-outline' },
    { label: 'CO2 évité', value: stats?.impact?.co2PreventedKg || 0, unit: 'Kg', icon: 'cloud-outline' },
    { label: 'Personnes aidées', value: stats?.impact?.totalPeopleHelped || 0, unit: 'Vies', icon: 'heart-outline' },
  ];

  const actions: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap; href: '/(admin)/users' | '/(admin)/transactions' | '/(admin)/annonces' }[] = [
    { title: 'Gérer les utilisateurs', body: 'Voir tous les comptes', icon: 'people-outline', href: '/(admin)/users' },
    { title: 'Transactions', body: 'Historique complet', icon: 'swap-horizontal-outline', href: '/(admin)/transactions' },
    { title: 'Annonces', body: 'Toutes les publications', icon: 'megaphone-outline', href: '/(admin)/annonces' },
  ];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Enter index={0}>
          <View
            style={{
              marginTop: 8,
              backgroundColor: c.primary,
              borderRadius: radius.xl,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.md,
                backgroundColor: c.primaryDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color={c.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="overline" color={c.onPrimary}>Console Admin</T>
              <T kind="h1" color={c.onPrimary} style={{ marginTop: 2 }}>Pilotage LBaraka</T>
            </View>
            <PressableScale
              onPress={handleLogout}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: c.primaryDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={c.onPrimary} />
            </PressableScale>
          </View>
        </Enter>

        <Enter index={1}>
          <View style={{ marginTop: 20 }}>
            <SectionHeader title="Vue globale" action="Actualiser" onAction={onRefresh} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {overview.map((item) => (
                <Card key={item.label} pad={16} style={{ width: '48%', flexGrow: 1, minWidth: 150 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: c.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons name={item.icon} size={18} color={c.primary} />
                  </View>
                  <T kind="h1">{String(item.value)}</T>
                  <T kind="caption" color={c.muted} style={{ marginTop: 4 }}>{item.label}</T>
                </Card>
              ))}
            </View>
          </View>
        </Enter>

        <Enter index={2}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Impact solidaire" />
            <Card pad={16} style={{ marginTop: 12, backgroundColor: c.goldSoft }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: c.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="heart" size={22} color={c.onGoldSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <T kind="h2" color={c.onGoldSoft}>{String(impact[2].value)} {impact[2].unit}</T>
                  <T kind="small" color={c.onGoldSoft}>{impact[2].label}</T>
                </View>
                <Tag label="Impact" tone="gold" />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                {impact.slice(0, 2).map((item) => (
                  <View key={item.label} style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.md, padding: 12 }}>
                    <Ionicons name={item.icon} size={18} color={c.onGoldSoft} />
                    <T kind="h3" color={c.onGoldSoft} style={{ marginTop: 6 }}>{String(item.value)}</T>
                    <T kind="caption" color={c.muted} style={{ marginTop: 2 }}>{item.unit} {item.label}</T>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </Enter>

        <Enter index={3}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Trésorerie" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <Card pad={16} style={{ flex: 1, backgroundColor: c.successSoft }}>
                <T kind="caption" color={c.onSuccessSoft}>En circulation</T>
                <T kind="h3" color={c.onSuccessSoft} style={{ marginTop: 6 }}>
                  {stats?.financial?.totalCirculatingMad?.toLocaleString() || 0} MAD
                </T>
              </Card>
              <Card pad={16} style={{ flex: 1, backgroundColor: c.goldSoft }}>
                <T kind="caption" color={c.onGoldSoft}>Fonds bloqués</T>
                <T kind="h3" color={c.onGoldSoft} style={{ marginTop: 6 }}>
                  {stats?.financial?.currentlyLockedMad?.toLocaleString() || 0} MAD
                </T>
              </Card>
            </View>
          </View>
        </Enter>

        <Enter index={4}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Actions rapides" />
            <View style={{ gap: 12, marginTop: 12 }}>
              {actions.map((item) => (
                <PressableScale key={item.href} onPress={() => router.push(item.href)}>
                  <Card pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T kind="bodyStrong">{item.title}</T>
                      <T kind="small" color={c.muted} style={{ marginTop: 2 }}>{item.body}</T>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={c.muted} />
                  </Card>
                </PressableScale>
              ))}
            </View>
          </View>
        </Enter>

        <Enter index={5}>
          <View style={{ marginTop: 20, marginBottom: 8 }}>
            <Button title="Voir l'application" variant="secondary" icon="eye-outline" onPress={() => router.push('/(tabs)/home')} />
          </View>
        </Enter>
      </ScrollView>
    </Screen>
  );
}
