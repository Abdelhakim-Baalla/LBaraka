import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

// GET /points-relais - Liste des points relais
// GET /points-relais/nearby - Points relais à proximité
// Query params: lat, lng, rayon (km), type (HANOUT | MOSQUEE | ASSOCIATION_QUARTIER)
// GET /points-relais/types - Liste des types disponibles
function relaisIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (type === 'MOSQUEE') return 'moon-outline';
  if (type === 'ASSOCIATION_QUARTIER') return 'people-outline';
  return 'storefront-outline';
}

function relaisTone(type?: string): 'primary' | 'gold' | 'info' | 'muted' {
  if (type === 'MOSQUEE') return 'gold';
  if (type === 'ASSOCIATION_QUARTIER') return 'info';
  return 'primary';
}

export default function PointsRelaisScreen() {
  const router = useRouter();
  const { c } = useTheme();
  const [relais, setRelais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRelais = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }
      const data = await ApiService.getPointsRelais(token);
      const list = data?.pointsRelais || data?.relais || data?.data || (Array.isArray(data) ? data : []);
      setRelais(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Points relais load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadRelais();
    }, [loadRelais])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRelais();
  };

  const openInMaps = (item: any) => {
    const geo = item?.geolocalisation || item?.geolocation || item?.coords;
    const lat = Array.isArray(geo) ? geo[0] : (item?.latitude ?? item?.lat);
    const lng = Array.isArray(geo) ? geo[1] : (item?.longitude ?? item?.lng);
    if (lat === undefined || lat === null || lng === undefined || lng === null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement des points relais...
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
            <T kind="overline" color={c.primary}>Échanges de proximité</T>
            <T kind="h2" style={{ marginTop: 2 }}>Points Relais</T>
          </View>
        </View>
      </Enter>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        style={{ marginTop: 16 }}
      >
        <Enter index={1}>
          <View
            style={{
              borderRadius: radius.xl,
              overflow: 'hidden',
              backgroundColor: c.surface2,
            }}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=1200&q=70' }}
              style={{ width: '100%', aspectRatio: 16 / 10 }}
              resizeMode="cover"
            />
            <View
              style={{
                margin: 14,
                marginTop: -64,
                backgroundColor: c.overlay,
                borderRadius: radius.lg,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="storefront-outline" size={16} color="#FFFFFF" />
                  <T kind="bodyStrong" color="#FFFFFF">Retrait en confiance</T>
                </View>
                <T kind="small" color="#FFFFFF">
                  {relais.length} relais partenaires pour vos échanges.
                </T>
              </View>
              <Tag label={`${relais.length} lieux`} tone="primary" />
            </View>
          </View>
        </Enter>

        <Enter index={2}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Types de relais" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Tag label="HANOUT" tone="primary" />
              <Tag label="MOSQUEE" tone="gold" />
              <Tag label="ASSOCIATION QUARTIER" tone="info" />
            </View>
          </View>
        </Enter>

        <Enter index={3}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Relais proches" action="Actualiser" onAction={onRefresh} />
          </View>
        </Enter>

        {relais.length === 0 ? (
          <Enter index={4}>
            <Card style={{ marginTop: 12 }}>
              <EmptyState
                icon="storefront-outline"
                title="Aucun relais"
                body="Aucun point relais disponible pour le moment."
              />
            </Card>
          </Enter>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            {relais.map((item, index) => {
              const name = String(item?.nom || item?.name || 'Point relais');
              const address = String(item?.adresse || item?.address || item?.ville || item?.city || 'Adresse à confirmer');
              const distance = item?.distanceKm ?? item?.distance;
              return (
                <Enter key={String(item?.id || index)} index={Math.min(index, 6)}>
                  <PressableScale onPress={() => openInMaps(item)}>
                    <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: radius.md,
                          backgroundColor: c.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={relaisIcon(item?.type)} size={22} color={c.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T kind="bodyStrong" numberOfLines={1}>{name}</T>
                        <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                          {address}
                        </T>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          <Tag label={String(item?.type || 'RELAIS')} tone={relaisTone(item?.type)} />
                          {distance !== undefined && distance !== null ? (
                            <Tag label={`${distance} km`} tone="muted" />
                          ) : null}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={c.muted} />
                    </Card>
                  </PressableScale>
                </Enter>
              );
            })}
          </View>
        )}

        <Enter index={5}>
          <View style={{ marginTop: 20, marginBottom: 8 }}>
            <Button title="Retour à la carte" icon="map-outline" onPress={() => router.push('/(tabs)/map')} />
          </View>
        </Enter>
      </ScrollView>
    </Screen>
  );
}
