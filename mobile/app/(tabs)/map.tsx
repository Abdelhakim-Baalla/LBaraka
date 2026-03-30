import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ApiService } from '../../services/api';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [annonces, setAnnonces] = useState<any[]>([]);
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
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
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
              onCalloutPress={() => router.push(`/(annonces)/${annonce.id}`)}
            />
          );
        })}
      </MapView>

      <View className="absolute bottom-5 left-4 right-4">
        <View className="bg-white rounded-2xl p-3 border border-outline-variant shadow-lg">
          <Text className="text-xs font-bold text-primary mb-1">
            {annonces.length} annonce{annonces.length > 1 ? 's' : ''} autour de vous
          </Text>
          <Text className="text-xs text-on-surface-variant">
            Cliquez sur un marqueur pour voir les détails
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
