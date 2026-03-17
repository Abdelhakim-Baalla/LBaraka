import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getAnnonces } from '../api/annonces';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

const CATS = ['Toutes', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];

const MODES: Record<string, string> = {
  DON_GRATUIT: '🎁',
  PRET_TEMPORAIRE: '🔄',
  LOCATION_SOLIDAIRE: '💶',
};

export default function AnnoncesScreen({ navigate }: Props) {
  const { token, logout } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState('Toutes');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cat = selectedCat === 'Toutes' ? undefined : selectedCat;
      const res = await getAnnonces(token!, cat);
      setAnnonces(res.annonces ?? []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedCat]);

  const AnnonceCard = ({ item }: any) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.titre}</Text>
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
        <Text style={s.headerT}>🌿 LBaraka</Text>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnSmall} onPress={() => navigate('Carte')}>
            <Text style={s.btnSmallT}>📍 Carte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSmall} onPress={logout}>
            <Text style={s.btnSmallT}>🚪</Text>
          </TouchableOpacity>
        </View>
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

      {/* Bouton publier */}
      <TouchableOpacity style={s.publishBtn} onPress={() => navigate('CreateAnnonce')}>
        <Text style={s.publishT}>+ Publier une annonce</Text>
      </TouchableOpacity>

      {/* Liste annonces */}
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
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyT}>Aucune annonce</Text>
              <Text style={s.emptySub}>Soyez le premier à publier !</Text>
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
  headerT: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', gap: 8 },
  btnSmall: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  btnSmallT: { color: '#fff', fontSize: 12 },
  filterBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  filterContent: { paddingHorizontal: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb', marginRight: 8 },
  filterChipOn: { backgroundColor: '#16a34a' },
  filterT: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  filterTOn: { color: '#fff', fontWeight: 'bold' },
  publishBtn: { margin: 12, backgroundColor: '#16a34a', padding: 13, borderRadius: 10, alignItems: 'center' },
  publishT: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  modeBadge: { fontSize: 18 },
  cardMeta: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#374151' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyT: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
