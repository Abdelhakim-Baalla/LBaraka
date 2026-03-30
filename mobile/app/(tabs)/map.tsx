import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [selectedAnnonce, setSelectedAnnonce] = useState<any>(null);
  const [userLocation, setUserLocation] = useState({ latitude: 33.58, longitude: -7.60 });

  const loadUserLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch {
      console.error('Unable to get location');
    }
  };

  const fetchNearby = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnoncesNearby(
        token,
        userLocation.latitude,
        userLocation.longitude,
        10
      );
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Nearby annonces error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadUserLocation();
      fetchNearby();
    }, [])
  );

  const getMarkerColor = (categorie: string) => {
    const colors: Record<string, string> = {
      POUSSETTE: '#C7F9CC',
      BRICOLAGE: '#FFD6A5',
      MEDICAL: '#D7E3FC',
      EVENEMENTIEL: '#FDE2E4',
      NOURRITURE: '#FFE8D6',
      AUTRE: '#E5E5E5',
    };
    return colors[categorie] || '#1B4332';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {annonces.map((annonce) => {
          if (!annonce.geolocalisation || annonce.geolocalisation.length < 2) return null;
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
      <View className="absolute top-0 left-0 right-0 bg-white/95 border-b border-outline-variant/30 px-5 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-on-surface-variant">Carte Interactive</Text>
            <Text className="text-base font-extrabold text-primary">Annonces Proches</Text>
          </View>
          <View className="bg-primary/10 px-3 py-2 rounded-lg">
            <Text className="text-xs font-bold text-primary">{annonces.length} annonces</Text>
          </View>
        </View>
      </View>

      {/* Bottom sheet avec liste des annonces */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-outline-variant" style={{ paddingBottom: insets.bottom + 10 }}>
        <View className="px-5 pt-4 pb-2">
          <View className="w-12 h-1 bg-outline-variant rounded-full self-center mb-3" />
          <Text className="text-sm font-extrabold text-primary mb-2">Annonces à proximité</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}>
          {annonces.length === 0 ? (
            <View className="bg-surface rounded-xl p-4 items-center justify-center" style={{ width: 280 }}>
              <Ionicons name="map-outline" size={24} color="#A5A6AA" />
              <Text className="text-xs text-on-surface-variant mt-2">Aucune annonce dans ce rayon</Text>
            </View>
          ) : (
            annonces.map((annonce) => (
              <Pressable
                key={annonce.id}
                onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                className={`bg-white border rounded-2xl p-3 ${selectedAnnonce?.id === annonce.id ? 'border-primary' : 'border-outline-variant'}`}
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
                  <Text className="text-xs text-on-surface-variant">{annonce.distance} km</Text>
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
