import { useCallback, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';
import { useTheme } from '../../theme/ThemeContext';
import { radius, shadowMd, shadowSm } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { T } from '../../components/ui/T';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

// Import conditionnel de react-native-maps (seulement sur mobile)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const CARD_W = 240;
const CARD_GAP = 12;
const SNAP = CARD_W + CARD_GAP;

export default function MapScreen() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [selectedAnnonce, setSelectedAnnonce] = useState<any>(null);
  const [userLocation, setUserLocation] = useState({ latitude: 33.58, longitude: -7.60 });
  const [mapRegion, setMapRegion] = useState({
    latitude: 33.58,
    longitude: -7.60,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const listRef = useRef<FlatList<any>>(null);
  const onViewableRef = useRef(({ viewableItems }: { viewableItems: Array<{ item?: any }> }) => {
    const first = viewableItems?.[0]?.item;
    if (first) {
      setSelectedAnnonce(first);
    }
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const scrollToAnnonceIndex = useCallback((index: number) => {
    if (index < 0) return;
    try {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    } catch {
      try {
        listRef.current?.scrollToOffset({ offset: index * SNAP, animated: true });
      } catch {
        // Carousel non pret, on ignore le defilement
      }
    }
  }, []);

  const loadUserLocation = async () => {
    try {
      setIsLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(newLocation);
        setMapRegion({
          ...newLocation,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        Alert.alert('Position mise à jour', 'Votre position a été actualisée');
      } else {
        Alert.alert('Permission refusée', 'Activez la localisation pour utiliser cette fonctionnalité');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    } finally {
      setIsLocating(false);
    }
  };

  const fetchNearby = async (silent = false) => {
    try {
      if (!silent) {
        setIsRefreshing(true);
      }

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnoncesNearby(
        token,
        userLocation.latitude,
        userLocation.longitude,
        50 // Rayon de 50km pour voir plus d'annonces
      );

      console.log('Annonces trouvées:', data.annonces?.length || 0);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Nearby annonces error:', error);
      Alert.alert('Erreur', 'Impossible de charger les annonces');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadUserLocation();
      fetchNearby(true);
    }, [])
  );

  const handleRefresh = () => {
    fetchNearby(false);
  };

  const handleMarkerPress = (annonce: any) => {
    setSelectedAnnonce(annonce);
    const idx = annonces.findIndex((a) => a?.id === annonce?.id);
    if (idx >= 0) {
      scrollToAnnonceIndex(idx);
    }
  };

  const getMarkerColor = (categorie: string) => {
    const colors: Record<string, string> = {
      POUSSETTE: c.success,
      BRICOLAGE: c.gold,
      MEDICAL: c.info,
      EVENEMENTIEL: c.primary,
      NOURRITURE: c.danger,
      AUTRE: c.muted,
    };
    return colors[categorie] || c.primary;
  };

  const cautionLabel = (annonce: any): string | null => {
    const raw = annonce?.caution ?? annonce?.montantCaution ?? annonce?.cautionMontant;
    const n = Number(raw);
    if (raw === undefined || raw === null || raw === '' || Number.isNaN(n)) return null;
    return `${n} DH`;
  };

  // Si on est sur web, afficher un message
  if (Platform.OS === 'web') {
    return (
      <Screen padBottom={108}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Enter index={0}>
            <Card style={{ width: '100%' }}>
              <EmptyState
                icon="map-outline"
                title="Carte non disponible sur web"
                body="La carte interactive est disponible uniquement sur l'application mobile (Android/iOS)."
                action="Retour à l'accueil"
                onAction={() => router.push('/(tabs)/home')}
              />
            </Card>
          </Enter>
        </View>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen padBottom={108}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="body" color={c.muted}>
            Chargement de la carte...
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={108} pad={0}>
      <View style={{ flex: 1 }}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {annonces.map((annonce) => {
            if (!annonce.geolocalisation || annonce.geolocalisation.length < 2) {
              console.log('Annonce sans géolocalisation:', annonce.id);
              return null;
            }
            return (
              <Marker
                key={annonce.id}
                coordinate={{
                  latitude: annonce.geolocalisation[0],
                  longitude: annonce.geolocalisation[1],
                }}
                title={annonce.titre}
                description={`${annonce.categorie} - ${annonce.distance}km`}
                pinColor={getMarkerColor(annonce.categorie)}
                onPress={() => handleMarkerPress(annonce)}
              />
            );
          })}
        </MapView>

        {/* Search pill flottante */}
        <View style={{ position: 'absolute', top: 12, left: 16, right: 16 }}>
          <Enter index={0}>
            <Card pad={12} style={{ borderRadius: radius.pill, ...shadowMd(mode) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.pill,
                    backgroundColor: c.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="search" size={20} color={c.muted} />
                </View>
                <PressableScale onPress={handleRefresh} disabled={isRefreshing} style={{ flex: 1 }}>
                  <T kind="bodyStrong" numberOfLines={1}>
                    Rechercher pres de moi
                  </T>
                  <T kind="caption" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                    {isRefreshing ? 'Actualisation...' : `${annonces.length} annonces dans un rayon de 50 km`}
                  </T>
                </PressableScale>
                <PressableScale
                  onPress={loadUserLocation}
                  disabled={isLocating}
                  accessibilityLabel="Me localiser"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.pill,
                    backgroundColor: c.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLocating ? 0.6 : 1,
                  }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={c.onPrimary} />
                  ) : (
                    <Ionicons name="locate" size={20} color={c.onPrimary} />
                  )}
                </PressableScale>
              </View>
            </Card>
          </Enter>
        </View>

        {/* FAB creation */}
        <PressableScale
          onPress={() => router.push('/(annonces)/create')}
          accessibilityLabel="Créer une annonce"
          style={{
            position: 'absolute',
            right: 16,
            bottom: 262,
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadowMd(mode),
          }}
        >
          <Ionicons name="add" size={28} color={c.onPrimary} />
        </PressableScale>

        {/* Carousel bas */}
        <View
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
          }}
        >
          <FlatList
            ref={listRef}
            data={annonces}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: CARD_GAP }}
            snapToInterval={SNAP}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
            onViewableItemsChanged={onViewableRef.current}
            viewabilityConfig={viewabilityConfig.current}
            ListEmptyComponent={
              <Card style={{ width: 280 }}>
                <EmptyState
                  icon="map-outline"
                  title="Aucune annonce dans un rayon de 50km"
                  action="Créer une annonce"
                  onAction={() => router.push('/(annonces)/create')}
                />
              </Card>
            }
            renderItem={({ item: annonce }) => {
              const selected = selectedAnnonce?.id === annonce.id;
              const caution = cautionLabel(annonce);
              return (
                <PressableScale onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                  <View
                    style={{
                      width: CARD_W,
                      backgroundColor: c.surface,
                      borderRadius: radius.lg,
                      padding: 10,
                      borderWidth: selected ? 2 : 0,
                      borderColor: selected ? c.primary : 'transparent',
                      ...shadowSm(mode),
                    }}
                  >
                    <View
                      style={{
                        height: 110,
                        borderRadius: radius.md,
                        overflow: 'hidden',
                        backgroundColor: c.surface2,
                        marginBottom: 8,
                      }}
                    >
                      <SmartAnnonceImage
                        uri={annonce.photos?.[0]}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <T kind="bodyStrong" numberOfLines={1}>
                      {annonce.titre}
                    </T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
                      {caution ? (
                        <Tag label={`Caution ${caution}`} tone="gold" />
                      ) : (
                        <Tag label={annonce.categorie || 'AUTRE'} tone="primary" />
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="location" size={12} color={c.muted} />
                        <T kind="caption" color={c.muted}>
                          {annonce.distance} km
                        </T>
                      </View>
                    </View>
                  </View>
                </PressableScale>
              );
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
