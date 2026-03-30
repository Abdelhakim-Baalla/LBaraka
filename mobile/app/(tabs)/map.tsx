import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const getMarkerColor = (categorie: string) => {
    const colors: Record<string, string> = {
      POUSSETTE: '#10b981',
      BRICOLAGE: '#f59e0b',
      MEDICAL: '#3b82f6',
      EVENEMENTIEL: '#ec4899',
      NOURRITURE: '#ef4444',
      AUTRE: '#6b7280',
    };
    return colors[categorie] || '#1B4332';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
        <Text className="text-sm text-on-surface-variant mt-3">Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
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
              onPress={() => setSelectedAnnonce(annonce)}
            />
          );
        })}
      </MapView>

      {/* Header flottant */}
      <Animated.View entering={FadeInUp.duration(500)} className="absolute top-0 left-0 right-0 bg-white/95 border-b border-outline-variant/30 px-5 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-on-surface-variant">Carte Interactive</Text>
            <Text className="text-base font-extrabold text-primary">Annonces Proches</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 px-3 py-2 rounded-lg">
              <Text className="text-xs font-bold text-primary">{annonces.length}</Text>
            </View>
            <Pressable
              onPress={handleRefresh}
              disabled={isRefreshing}
              className="bg-white border border-outline-variant rounded-lg p-2"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#1B4332" />
              ) : (
                <Ionicons name="refresh" size={18} color="#1B4332" />
              )}
            </Pressable>
          </View>
        </View>
        
        <View className="flex-row gap-2">
          <Pressable
            onPress={loadUserLocation}
            disabled={isLocating}
            className="flex-1 bg-primary rounded-lg py-2.5 flex-row items-center justify-center gap-2"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={16} color="#fff" />
            )}
            <Text className="text-white font-bold text-xs">
              {isLocating ? 'Localisation...' : 'Me localiser'}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => router.push('/(annonces)/create')}
            className="flex-1 bg-white border border-outline-variant rounded-lg py-2.5 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle-outline" size={16} color="#1B4332" />
            <Text className="text-primary font-bold text-xs">Créer annonce</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom sheet avec liste des annonces */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-outline-variant" style={{ paddingBottom: insets.bottom + 10 }}>
        <View className="px-5 pt-4 pb-2">
          <View className="w-12 h-1 bg-outline-variant rounded-full self-center mb-3" />
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-extrabold text-primary">Annonces à proximité</Text>
            {annonces.length === 0 ? (
              <Pressable onPress={handleRefresh} className="bg-primary/10 rounded-lg px-3 py-1.5">
                <Text className="text-xs font-bold text-primary">Recharger</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}>
          {annonces.length === 0 ? (
            <View className="bg-surface rounded-xl p-4 items-center justify-center" style={{ width: 280 }}>
              <Ionicons name="map-outline" size={24} color="#A5A6AA" />
              <Text className="text-xs text-on-surface-variant mt-2 text-center">
                Aucune annonce dans un rayon de 50km
              </Text>
              <Pressable
                onPress={() => router.push('/(annonces)/create')}
                className="bg-primary rounded-lg px-4 py-2 mt-3"
              >
                <Text className="text-white font-bold text-xs">Créer une annonce</Text>
              </Pressable>
            </View>
          ) : (
            annonces.map((annonce) => (
              <Pressable
                key={annonce.id}
                onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                className={`bg-white border rounded-2xl p-3 ${selectedAnnonce?.id === annonce.id ? 'border-primary border-2' : 'border-outline-variant'}`}
                style={{ width: 280 }}
              >
                <SmartAnnonceImage
                  uri={annonce.photos?.[0]}
                  className="w-full h-32 rounded-xl mb-2 overflow-hidden"
                  resizeMode="cover"
                />
                <Text className="text-sm font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
                <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>{annonce.description}</Text>
                
                <View className="flex-row items-center justify-between mt-2">
                  <View className="bg-primary/10 px-2 py-1 rounded-lg">
                    <Text className="text-[10px] font-semibold text-primary">{annonce.categorie}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location" size={12} color="#6b7280" />
                    <Text className="text-xs text-on-surface-variant">{annonce.distance} km</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
