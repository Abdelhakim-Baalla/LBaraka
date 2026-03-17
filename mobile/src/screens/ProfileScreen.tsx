import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { getProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

export default function ProfileScreen({ navigate }: Props) {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile(token!);
        setUser(res.utilisateur);
      } catch (e: any) {
        Alert.alert('Erreur', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnexion',
        style: 'destructive',
        onPress: () => {
          logout();
          navigate('Annonces');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.error}>Impossible de charger le profil</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigate('Annonces')}>
          <Text style={s.btnT}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = user.profil?.lBarakaScore || 0;
  const tier = user.profil?.palier || 'BRONZE';

  return (
    <ScrollView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Annonces')}>
          <Text style={s.back}>Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Profil</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Informations</Text>
        <View style={s.row}>
          <Text style={s.label}>Email</Text>
          <Text style={s.value}>{user.email}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Telephone</Text>
          <Text style={s.value}>{user.telephone}</Text>
        </View>
        {user.profil?.cin && (
          <View style={s.row}>
            <Text style={s.label}>CIN</Text>
            <Text style={s.value}>{user.profil.cin}</Text>
          </View>
        )}
        <View style={s.row}>
          <Text style={s.label}>Role</Text>
          <Text style={s.value}>{user.role}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>LBaraka Score</Text>
        <View style={s.scoreBox}>
          <Text style={s.scoreValue}>{score}</Text>
          <Text style={s.scoreLabel}>points</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Niveau</Text>
          <Text style={s.tier}>{tier}</Text>
        </View>
      </View>

      {user.profil?.badges && user.profil.badges.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Badges</Text>
          <View style={s.badgesRow}>
            {user.profil.badges.map((badge: string, idx: number) => (
              <View key={idx} style={s.badge}>
                <Text style={s.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTitle}>Preferences</Text>
        <View style={s.row}>
          <Text style={s.label}>Langue</Text>
          <Text style={s.value}>{user.profil?.langueInterface || 'FRANCAIS'}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutT}>Deconnexion</Text>
      </TouchableOpacity>

      <View style={s.spacer} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  label: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  value: { fontSize: 14, color: '#111', fontWeight: '600' },
  scoreBox: { alignItems: 'center', paddingVertical: 16, backgroundColor: '#f0fdf4', borderRadius: 8, marginVertical: 12 },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: '#16a34a' },
  scoreLabel: { fontSize: 12, color: '#6b7280' },
  tier: { fontSize: 14, color: '#16a34a', fontWeight: 'bold' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: '#15803d', fontSize: 12, fontWeight: '600' },
  logoutBtn: { margin: 12, backgroundColor: '#ef4444', padding: 14, borderRadius: 10, alignItems: 'center' },
  logoutT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { fontSize: 16, color: '#ef4444', marginBottom: 16 },
  btn: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnT: { color: '#fff', fontWeight: 'bold' },
  spacer: { height: 40 },
});

