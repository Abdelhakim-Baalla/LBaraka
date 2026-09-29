import { useCallback, useState } from 'react';
import { View, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius, shadowSm } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { T } from '../../components/ui/T';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

export default function FoodRescueScreen() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charge les annonces Food Rescue
  const loadFoodRescue = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getFoodRescue(token);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Food rescue load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadFoodRescue();
    }, [])
  );

  // Rafraîchit la liste
  const onRefresh = () => {
    setRefreshing(true);
    loadFoodRescue();
  };

  const getExpiry = (annonce: any): string | undefined => {
    return annonce?.expirationDate || annonce?.dateExpiration || undefined;
  };

  const getRelais = (annonce: any): string => {
    return (
      annonce?.pointRelais?.nom ||
      annonce?.relais ||
      annonce?.quartier ||
      annonce?.adresse ||
      ''
    );
  };

  const hoursLeft = (iso?: string): number | null => {
    if (!iso) return null;
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return null;
    return Math.max(0, Math.ceil((ts - Date.now()) / 3600000));
  };

  const dayNumber = (iso?: string): string => {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return '';
    return String(new Date(iso).getDate());
  };

  const monthLabel = (iso?: string): string => {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return '';
    return new Date(iso)
      .toLocaleDateString('fr-FR', { month: 'short' })
      .toUpperCase()
      .replace(/\./g, '');
  };

  if (isLoading) {
    return (
      <Screen padBottom={108}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={108}>
      <View style={{ flex: 1, gap: 16, paddingTop: 8 }}>
        {/* Header */}
        <Enter index={0}>
          <View style={{ marginTop: 8 }}>
            <T kind="overline" color={c.muted}>
              Sauvetage alimentaire
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
              <T kind="h1" style={{ flex: 1 }}>
                Food Rescue
              </T>
              <Tag label={`${annonces.length} actif${annonces.length > 1 ? 's' : ''}`} tone="gold" />
            </View>
            <T kind="body" color={c.muted} style={{ marginTop: 8 }}>
              Repas et invendus à récupérer rapidement dans votre quartier.
            </T>
          </View>
        </Enter>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
        >
          {annonces.length === 0 ? (
            <Card>
              <EmptyState
                icon="restaurant-outline"
                title="Aucun Food Rescue actif maintenant."
                body="De nouveaux repas à sauver apparaîtront ici."
                action="Voir les annonces"
                onAction={() => router.push('/(tabs)/home')}
              />
            </Card>
          ) : (
            annonces.map((annonce, i) => {
              const expiry = getExpiry(annonce);
              const relais = getRelais(annonce);
              const hours = hoursLeft(expiry);
              const day = dayNumber(expiry);
              const month = monthLabel(expiry);

              return (
                <Enter key={annonce.id} index={Math.min(i, 6)}>
                  <PressableScale
                    onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: radius.lg,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      ...shadowSm(mode),
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        minHeight: 64,
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        backgroundColor: c.surface2,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {expiry && day ? (
                        <>
                          <T kind="h2">{day}</T>
                          <T kind="caption" color={c.muted} style={{ marginTop: 2 }}>
                            {month}
                          </T>
                        </>
                      ) : (
                        <Ionicons name="restaurant-outline" size={24} color={c.muted} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <T kind="bodyStrong" numberOfLines={1}>
                        {annonce.titre}
                      </T>
                      {relais ? (
                        <T kind="caption" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                          {relais}
                        </T>
                      ) : null}
                      <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                        {hours !== null ? (
                          <Tag label={`Plus que ${hours} h`} tone="gold" />
                        ) : (
                          <Tag label="A recuperer vite" tone="info" />
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.muted} />
                  </PressableScale>
                </Enter>
              );
            })
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
