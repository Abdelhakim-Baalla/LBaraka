import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { getAnnoncesNearby } from '../api/annonces';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

const CATS = ['Toutes', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const RAYONS = [5, 10, 20, 50];

const MODES: Record<string, string> = {
  DON_GRATUIT: '🎁',
  PRET_TEMPORAIRE: '🔄',
  LOCATION_SOLIDAIRE: '💶',
};

export default function CarteScreen({ navigate }: Props) {
  const { token } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rayon, setRayon] = useState(10);
  const [selectedCat, setSelectedCat] = useState('Toutes');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let lat = 33.5731, lng = -7.5898; // Casablanca par défaut

      // Demander la localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const cat = selectedCat === 'Toutes' ? undefined : selectedCat;
      const res = await getAnnoncesNearby(token!, lat, lng, rayon, cat);
      setAnnonces(res.annonces ?? []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedCat, rayon]);

  const AnnonceCard = ({ item }: any) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.cardTitle} numberOfLines={1}>{item.titre}</Text>
          <Text style={s.cardDist}>📍 {item.distance} km</Text>
        </View>
        <Text style={s.modeBadge}>{MODES[item.mode]}</Text>
      </View>
      <Text style={s.cardMeta}>{item.categorie} · {item.condition}</Text>
      <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
    </View>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Annonces')}>
          <Text style={s.back}>← Listes</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Carte Proximité</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Filtres catégorie */}
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

      {/* Filtres rayon */}
      <View style={s.rayonBar}>
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

      {/* Liste */}
      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 60 }} />
      ) : (
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
              {annonces.length} annonce{annonces.length !== 1 ? 's' : ''} dans un rayon de {rayon} km
            </Text>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyT}>Aucune annonce proche</Text>
            </View>
          }
          renderItem={({ item }) => <AnnonceCard item={item} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 14 },
  headerT: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  filterBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  filterContent: { paddingHorizontal: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#e5e7eb', marginRight: 6 },
  filterChipOn: { backgroundColor: '#16a34a' },
  filterT: { color: '#6b7280', fontSize: 12 },
  filterTOn: { color: '#fff', fontWeight: 'bold' },
  rayonBar: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  rayonChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#f3f4f6' },
  rayonChipOn: { backgroundColor: '#16a34a' },
  rayonT: { color: '#6b7280', fontSize: 11, fontWeight: '500' },
  rayonTOn: { color: '#fff', fontWeight: 'bold' },
  countT: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1 },
  cardDist: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  modeBadge: { fontSize: 18 },
  cardMeta: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#374151' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyT: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 12 },
});
