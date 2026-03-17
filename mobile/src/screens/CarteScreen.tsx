import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const mapRef = useRef<MapView | null>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const { token } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rayon, setRayon] = useState(10);
  const [selectedCat, setSelectedCat] = useState('Toutes');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [myPosition, setMyPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedAnnonceId, setSelectedAnnonceId] = useState<string | null>(null);
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMapCenter(null);
        setAnnonces([]);
        setGpsError('Permission localisation refusée. Activez le GPS pour voir les annonces proches.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const nextPosition = { latitude: lat, longitude: lng };
      setMyPosition(nextPosition);
      setMapCenter(nextPosition);
      setGpsError(null);
      const cat = selectedCat === 'Toutes' ? undefined : selectedCat;
      const res = await getAnnoncesNearby(token!, lat, lng, rayon, cat);
      setAnnonces(res.annonces ?? []);
    } catch (e: any) {
      setMyPosition(null);
      setMapCenter(null);
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

  const focusAnnonce = (item: any) => {
    if (!Array.isArray(item.geolocalisation) || item.geolocalisation.length < 2) return;
    const nextCenter = {
      latitude: item.geolocalisation[0],
      longitude: item.geolocalisation[1],
    };

    setSelectedAnnonceId(item.id);
    setMapCenter(nextCenter);

    mapRef.current?.animateToRegion({
      ...nextCenter,
      latitudeDelta,
      longitudeDelta,
    }, 450);

    setTimeout(() => {
      markerRefs.current[item.id]?.showCallout();
    }, 220);
  };

  const focusMyLocation = () => {
    if (!myPosition) {
      Alert.alert('Position indisponible', 'Impossible de vous localiser pour le moment.');
      return;
    }

    setSelectedAnnonceId(null);
    setMapCenter(myPosition);
    mapRef.current?.animateToRegion({
      ...myPosition,
      latitudeDelta,
      longitudeDelta,
    }, 450);
  };

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
          {myPosition
            ? `Position GPS : ${myPosition.latitude.toFixed(6)}, ${myPosition.longitude.toFixed(6)}`
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
      ) : !mapCenter ? (
        <View style={s.empty}>
          <Text style={s.emptyT}>Position GPS requise</Text>
          <Text style={s.emptySub}>Activez la localisation pour voir les annonces proches.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryT}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.mapWrap}>
            <MapView
              ref={mapRef}
              style={s.map}
              initialRegion={{
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta,
                longitudeDelta,
              }}
              region={{
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta,
                longitudeDelta,
              }}
            >
              {myPosition && (
                <Marker
                  coordinate={{ latitude: myPosition.latitude, longitude: myPosition.longitude }}
                  title="Votre position"
                  pinColor="blue"
                />
              )}
              {markers.map((item) => (
                <Marker
                  key={item.id}
                  ref={(ref) => { markerRefs.current[item.id] = ref; }}
                  coordinate={{
                    latitude: item.geolocalisation[0],
                    longitude: item.geolocalisation[1],
                  }}
                  title={item.titre}
                  description={`${item.categorie} - ${item.distance} km`}
                  onPress={() => setSelectedAnnonceId(item.id)}
                />
              ))}
            </MapView>

            <TouchableOpacity style={s.locateBtn} onPress={focusMyLocation}>
              <Text style={s.locateBtnText}>Me localiser</Text>
            </TouchableOpacity>
          </View>

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
              <TouchableOpacity
                style={[s.card, selectedAnnonceId === item.id && s.cardSelected]}
                onPress={() => focusAnnonce(item)}
                activeOpacity={0.85}
              >
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
              </TouchableOpacity>
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
  mapWrap: { position: 'relative' },
  map: { width: '100%', height: 300 },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#16a34a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  countT: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardSelected: { borderWidth: 1, borderColor: '#16a34a' },
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
