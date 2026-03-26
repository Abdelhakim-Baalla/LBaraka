import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from 'react-native-maps';
import { getPointsRelaisNearby } from '../api/points-relais';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

const TYPES = ['Tous', 'HANOUT', 'MOSQUEE', 'ASSOCIATION_QUARTIER'];
const RAYONS = [5, 10, 20, 50, 100];

export default function PartenairesScreen({ navigate }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const { token } = useAuth();

  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rayon, setRayon] = useState(10);
  const [selectedType, setSelectedType] = useState('Tous');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [myPosition, setMyPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMapCenter(null);
        setPartenaires([]);
        setGpsError('Permission localisation refusée. Activez le GPS pour voir les partenaires proches.');
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

      const type = selectedType === 'Tous' ? undefined : selectedType;
      const res = await getPointsRelaisNearby(token!, lat, lng, rayon, type);
      setPartenaires(res.points ?? []);
    } catch (e: any) {
      setMyPosition(null);
      setMapCenter(null);
      setPartenaires([]);
      setGpsError(e?.message ?? 'Impossible de récupérer la position GPS.');
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedType, rayon]);

  const markers = useMemo(
    () => partenaires.filter((p) => Array.isArray(p.geolocalisation) && p.geolocalisation.length >= 2),
    [partenaires],
  );

  const latitudeDelta = Math.max(0.06, rayon / 85);
  const longitudeDelta = Math.max(0.06, rayon / 85);

  const focusPartenaire = (item: any) => {
    if (!Array.isArray(item.geolocalisation) || item.geolocalisation.length < 2) return;
    const nextCenter = {
      latitude: item.geolocalisation[0],
      longitude: item.geolocalisation[1],
    };

    setSelectedId(item.id);
    setMapCenter(nextCenter);

    mapRef.current?.animateToRegion({
      ...nextCenter,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
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

    setSelectedId(null);
    setMapCenter(myPosition);
    mapRef.current?.animateToRegion({
      ...myPosition,
      latitudeDelta,
      longitudeDelta,
    }, 450);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[s.card, selectedId === item.id && s.cardOn]}
      onPress={() => focusPartenaire(item)}
      activeOpacity={0.8}
    >
      <View style={s.cardHead}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.nom}</Text>
        <View style={s.typeBadge}>
          <Text style={s.typeText}>{item.type}</Text>
        </View>
      </View>
      <Text style={s.cardAddr} numberOfLines={1}>📍 {item.adresse}</Text>
      <View style={s.cardFooter}>
        <Text style={s.cardDist}>{item.distance} km</Text>
        <Text style={s.cardTel}>📞 {item.telephone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Annonces')}>
          <Text style={s.back}>← Annonces</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Partenaires Relais</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* GPS Status */}
      <View style={s.banner}>
        <Text style={s.bannerT}>
          {myPosition ? `GPS Actif (${myPosition.latitude.toFixed(4)}, ${myPosition.longitude.toFixed(4)})` : gpsError || 'Localisation...'}
        </Text>
      </View>

      {/* Type Filters */}
      <FlatList
        horizontal
        data={TYPES}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        style={s.typeBar}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.typeChip, selectedType === item && s.typeChipOn]}
            onPress={() => setSelectedType(item)}
          >
            <Text style={[s.typeChipT, selectedType === item && s.typeChipTOn]}>{item.replace('_', ' ')}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Rayon Selector */}
      <View style={s.rayonRow}>
        <Text style={s.rayonL}>Rayon :</Text>
        {RAYONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.rayonChip, rayon === r && s.rayonChipOn]}
            onPress={() => setRayon(r)}
          >
            <Text style={[s.rayonT, rayon === r && s.rayonTOn]}>{r}km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 60 }} />
      ) : !mapCenter ? (
        <View style={s.empty}>
          <Text style={s.emptyT}>Position GPS requise</Text>
          <TouchableOpacity style={s.retry} onPress={() => load()}>
            <Text style={s.retryT}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.mapBox}>
            <MapView
              ref={mapRef}
              style={s.map}
              initialRegion={{
                ...mapCenter,
                latitudeDelta,
                longitudeDelta,
              }}
              region={{
                ...mapCenter,
                latitudeDelta,
                longitudeDelta,
              }}
            >
              {myPosition && (
                <Marker
                  coordinate={myPosition}
                  title="Moi"
                  pinColor="blue"
                />
              )}
              {markers.map((p) => (
                <Marker
                  key={p.id}
                  ref={(ref) => { markerRefs.current[p.id] = ref; }}
                  coordinate={{ latitude: p.geolocalisation[0], longitude: p.geolocalisation[1] }}
                  title={p.nom}
                  description={p.adresse}
                  onPress={() => setSelectedId(p.id)}
                >
                    <Callout>
                      <View style={{ padding: 6, width: 200 }}>
                        <Text style={{ fontWeight: 'bold' }}>{p.nom}</Text>
                        <Text style={{ fontSize: 11 }}>{p.adresse}</Text>
                        <Text style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>Ouvert aujourd'hui</Text>
                      </View>
                    </Callout>
                </Marker>
              ))}
            </MapView>
            <TouchableOpacity style={s.locate} onPress={focusMyLocation}>
              <Text style={s.locateT}>Me localiser</Text>
            </TouchableOpacity>
          </View>

          {/* List View */}
          <FlatList
            data={partenaires}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={['#16a34a']} />
            }
            ListHeaderComponent={
              <Text style={s.listCount}>{partenaires.length} Partenaires LBaraka autour de vous</Text>
            }
            ListEmptyComponent={
              <View style={s.emptySmall}>
                <Text style={s.emptySmallT}>Aucun partenaire dans ce rayon.</Text>
              </View>
            }
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 14 },
  headerT: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  banner: { backgroundColor: '#dcfce7', padding: 8, alignItems: 'center' },
  bannerT: { color: '#15803d', fontSize: 11, fontWeight: '600' },
  typeBar: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 8 },
  typeChipOn: { backgroundColor: '#16a34a' },
  typeChipT: { fontSize: 11, color: '#6b7280' },
  typeChipTOn: { color: '#fff', fontWeight: 'bold' },
  rayonRow: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  rayonL: { fontSize: 11, color: '#9ca3af' },
  rayonChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f9fafb' },
  rayonChipOn: { backgroundColor: '#16a34a' },
  rayonT: { fontSize: 11, color: '#6b7280' },
  rayonTOn: { color: '#fff', fontWeight: 'bold' },
  mapBox: { width: '100%', height: 260, position: 'relative' },
  map: { flex: 1 },
  locate: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  locateT: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  listCount: { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  cardOn: { borderColor: '#16a34a', borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1 },
  typeBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 9, color: '#6b7280', fontWeight: 'bold' },
  cardAddr: { fontSize: 12, color: '#4b5563', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  cardDist: { fontSize: 12, color: '#16a34a', fontWeight: 'bold' },
  cardTel: { fontSize: 11, color: '#6b7280' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyT: { color: '#9ca3af', fontSize: 14 },
  retry: { marginTop: 12, backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryT: { color: '#fff', fontWeight: '600' },
  emptySmall: { padding: 40, alignItems: 'center' },
  emptySmallT: { color: '#9ca3af', fontSize: 12 },
});
