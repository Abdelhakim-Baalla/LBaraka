import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getAnnonces } from '../api/annonces';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

const MODES: Record<string, string> = {
  DON_GRATUIT: '🎁 Don gratuit',
  PRET_TEMPORAIRE: '🔄 Prêt',
  LOCATION_SOLIDAIRE: '💶 Location',
};

export default function AnnoncesScreen({ navigate }: Props) {
  const { token, logout } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getAnnonces(token!);
      setAnnonces(res.annonces ?? []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerT}>🌿 LBaraka</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutT}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Publish button */}
      <TouchableOpacity style={s.publishBtn} onPress={() => navigate('CreateAnnonce')}>
        <Text style={s.publishT}>+ Publier une annonce</Text>
      </TouchableOpacity>

      {/* List */}
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
              <Text style={s.emptyT}>Aucune annonce pour l'instant</Text>
              <Text style={s.emptySub}>Soyez le premier à publier !</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardRow}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.titre}</Text>
                <Text style={s.modeBadge}>{MODES[item.mode] ?? item.mode}</Text>
              </View>
              <Text style={s.cardCat}>{item.categorie} · {item.condition}</Text>
              <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerT: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  logoutT: { color: '#fff', fontSize: 13 },
  publishBtn: { margin: 12, backgroundColor: '#16a34a', padding: 13, borderRadius: 10, alignItems: 'center' },
  publishT: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  modeBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 11, color: '#15803d' },
  cardCat: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#374151' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyT: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
