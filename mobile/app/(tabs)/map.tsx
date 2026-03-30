import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ApiService } from '../../services/api';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [latitude, setLatitude] = useState('33.58');
  const [longitude, setLongitude] = useState('-7.60');
  const [rayon, setRayon] = useState('10');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);

  const useCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
    } catch {
      console.error('Unable to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const fetchNearby = async () => {
    try {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const rayonKm = Number(rayon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(rayonKm)) {
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnoncesNearby(token, lat, lng, rayonKm);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Nearby annonces error:', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNearby();
    }, [])
  );

  const handleSearch = async () => {
    setIsSearching(true);
    await fetchNearby();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Carte Communautaire</Text>
          <Ionicons name="map-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">
          Visualisez les annonces proches et les points relais autour de vous.
        </Text>
      </View>

      <View className="bg-white border border-outline-variant rounded-2xl p-3 mb-3">
        <Text className="text-xs font-bold text-on-surface-variant mb-1">Latitude</Text>
        <TextInput
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2.5 mb-2"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Longitude</Text>
        <TextInput
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2.5 mb-2"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Rayon (km)</Text>
        <TextInput
          value={rayon}
          onChangeText={setRayon}
          keyboardType="numeric"
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2.5"
        />

        <Pressable
          onPress={useCurrentLocation}
          disabled={isGettingLocation}
          className={`rounded-xl py-3 items-center justify-center flex-row gap-2 mt-3 ${isGettingLocation ? 'bg-surface-container' : 'bg-primary/10'}`}
        >
          {isGettingLocation ? <ActivityIndicator color="#1B4332" /> : <Ionicons name="locate-outline" size={18} color="#1B4332" />}
          <Text className="text-primary font-bold">{isGettingLocation ? 'Localisation...' : 'Utiliser ma position réelle'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSearch}
        disabled={isSearching}
        className={`rounded-xl py-4 px-4 flex-row items-center justify-center gap-2 mb-3 ${isSearching ? 'bg-primary/60' : 'bg-primary'}`}
      >
        {isSearching ? <ActivityIndicator color="#fff" /> : <Ionicons name="search-outline" size={18} color="#fff" />}
        <Text className="text-white font-bold">{isSearching ? 'Recherche...' : 'Rechercher autour de moi'}</Text>
      </Pressable>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {annonces.length === 0 ? (
          <View className="bg-white border border-outline-variant rounded-2xl p-5 items-center">
            <Ionicons name="map-outline" size={28} color="#A5A6AA" />
            <Text className="text-on-surface-variant mt-2">Aucune annonce dans ce rayon.</Text>
          </View>
        ) : (
          annonces.map((annonce) => (
            <Pressable
              key={annonce.id}
              onPress={() => router.push(`/(annonces)/${annonce.id}`)}
              className="bg-white border border-outline-variant rounded-2xl p-3 mb-3"
            >
              <Text className="text-base font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
              <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>{annonce.description}</Text>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-xs text-on-surface-variant">Distance: {String(annonce.distance ?? '-')} km</Text>
                <Ionicons name="chevron-forward" size={18} color="#1B4332" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/(points-relais)')}
        className="bg-white border border-outline-variant rounded-xl py-4 px-4 flex-row items-center justify-center gap-2 mb-3"
      >
        <Ionicons name="storefront-outline" size={18} color="#1B4332" />
        <Text className="text-primary font-bold">Voir les points relais</Text>
      </Pressable>
    </View>
  );
}
