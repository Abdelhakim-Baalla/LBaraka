import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { getAnnoncesNearby } from '../api/annonces';
import { useAuth } from '../context/AuthContext';
type Props = { navigate: (s: string) => void };
const CATS = ['Toutes', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const RAYONS = [5, 10, 20, 50, 100, 200];
export default function CarteScreen({ navigate }: Props) {
  const { token } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rayon, setRayon] = useState(10);
  const [selectedCat, setSelectedCat] = useState('Toutes');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCenter(null);
        setAnnonces([]);
        setGpsError('Permission localisation refusée. Activez le GPS pour voir les annonces proches.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCenter({ latitude: lat, longitude: lng });
      setGpsError(null);
      const cat = selectedCat === 'Toutes' ? undefined : selectedCat;
      const res = await getAnnoncesNearby(token!, lat, lng, rayon, cat);
      setAnnonces(res.annonces ?? []);
    } catch (e: any) {
      setCenter(null);
      setAnnonces([]);
      setGpsError(e?.message ?? 'Impossible de récupérer la position GPS.');
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { load(); }, [selectedCat, rayon]);

  const markers = useMemo(
    () => annonces.filter((a) => Array.isArray(a.geolocalisation) && a.geolocalisation.length >= 2),
    [annonces],
  );

  const latitudeDelta = Math.max(0.06, rayon / 85);
  const longitudeDelta = Math.max(0.06, rayon / 85);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Annonces')}>
          <Text style={s.back}>Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Proximite</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.locBanner}>
        <Text style={s.locT}>
          {center
            ? `Position GPS : ${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`
            : gpsError ?? 'Position GPS indisponible'}
        </Text>
      </View>
      <FlatList
        horizontal
        data={CATS}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.filterChip, selectedCat === item && s.filterChipOn]}
            onPress={() => setSelectedCat(item)}
          >
            <Text style={[s.filterT, selectedCat === item && s.filterTOn]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={s.rayonBar}>
        <Text style={s.rayonLabel}>Rayon :</Text>
        {RAYONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.rayonChip, rayon === r && s.rayonChipOn]}
            onPress={() => setRayon(r)}
          >
            <Text style={[s.rayonT, rayon === r && s.rayonTOn]}>{r} km</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 60 }} />
      ) : !center ? (
        <View style={s.empty}>
          <Text style={s.emptyT}>Position GPS requise</Text>
          <Text style={s.emptySub}>Activez la localisation pour voir les annonces proches.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryT}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
            style={s.map}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta,
              longitudeDelta,
            }}
            region={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta,
              longitudeDelta,
            }}
          >
            <Marker
              coordinate={{ latitude: center.latitude, longitude: center.longitude }}
              title="Votre position"
              pinColor="blue"
            />
            {markers.map((item) => (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.geolocalisation[0],
                  longitude: item.geolocalisation[1],
                }}
                title={item.titre}
                description={`${item.categorie} - ${item.distance} km`}
              />
            ))}
          </MapView>

          <FlatList
            data={annonces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(true); }}
                colors={['#16a34a']}
              />
            }
            ListHeaderComponent={
              <Text style={s.countT}>
                {annonces.length} annonce{annonces.length !== 1 ? 's' : ''} dans {rayon} km
              </Text>
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyT}>Aucune annonce proche</Text>
                <Text style={s.emptySub}>Essayez un rayon plus grand</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.titre}</Text>
                  <View style={s.distBadge}>
                    <Text style={s.distT}>{item.distance} km</Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>
                  {item.mode.replace(/_/g, ' ')} - {item.categorie} - {item.condition}
                </Text>
                <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                {item.createur?.email && (
                  <Text style={s.createur}>Par : {item.createur.email}</Text>
                )}
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 14 },
  headerT: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  locBanner: { backgroundColor: '#dcfce7', paddingHorizontal: 16, paddingVertical: 6 },
  locT: { fontSize: 12, color: '#15803d', fontWeight: '500' },
  filterBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  filterContent: { paddingHorizontal: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#e5e7eb', marginRight: 6 },
  filterChipOn: { backgroundColor: '#16a34a' },
  filterT: { color: '#6b7280', fontSize: 12 },
  filterTOn: { color: '#fff', fontWeight: 'bold' },
  rayonBar: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  rayonLabel: { fontSize: 12, color: '#6b7280', marginRight: 4 },
  rayonChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#f3f4f6' },
  rayonChipOn: { backgroundColor: '#16a34a' },
  rayonT: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  rayonTOn: { color: '#fff', fontWeight: 'bold' },
  map: { width: '100%', height: 300 },
  countT: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  distBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  distT: { fontSize: 12, color: '#15803d', fontWeight: 'bold' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#374151' },
  createur: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyT: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  retryBtn: { marginTop: 12, backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  retryT: { color: '#fff', fontWeight: '600' },
});
