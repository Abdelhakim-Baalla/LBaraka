import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { getAnnoncesCartes } from '../api/annonces';
import { useAuth } from '../context/AuthContext';

export default function CarteScreen() {
  const { token } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let lat = 33.5731, lng = -7.5898;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      try {
        const res = await getAnnoncesCartes(token, lat, lng, 10);
        setAnnonces(res.annonces);
      } catch (e: any) {
        Alert.alert('Erreur', e.message);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={{ marginTop: 10, color: '#555' }}>Recherche des annonces proches...</Text>
    </View>
  );

  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.headerT}>{annonces.length} annonce(s) dans un rayon de 10 km</Text>
      </View>
      <FlatList data={annonces} keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={s.empty}>Aucune annonce proche</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.badge}><Text style={s.badgeT}>{item.distance} km</Text></View>
            <Text style={s.cardT}>{item.titre}</Text>
            <Text style={s.cardM}>{item.categorie} · {item.mode}</Text>
            <Text style={s.cardD} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#16a34a', padding: 14 },
  headerT: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 6 },
  badgeT: { color: '#16a34a', fontWeight: 'bold', fontSize: 12 },
  cardT: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardM: { fontSize: 12, color: '#16a34a', marginTop: 2 },
  cardD: { fontSize: 13, color: '#555', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
