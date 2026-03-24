import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMyTransactions, getContratByTransaction } from '../api/transactions';

type Props = { navigate: (s: string) => void };

export default function TransactionsScreen({ navigate }: Props) {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMyTransactions(token!);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleVoirContrat = async (txId: string) => {
    try {
      const res = await getContratByTransaction(token!, txId);
      if (res.urlPdfBilingue) {
        Linking.openURL(res.urlPdfBilingue);
      } else {
        Alert.alert('Info', 'Contrat non encore généré.');
      }
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de récupérer le contrat.');
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.id}>#{item.id.substring(0, 8)}</Text>
        <Text style={[s.statut, item.statut === 'TERMINEE' ? s.statutOk : s.statutWait]}>
          {item.statut}
        </Text>
      </View>
      <Text style={s.itemTitle}>{item.annonce.titre}</Text>
      <Text style={s.itemRole}>
        Partie : {item.preteur.email === 'votre_email' ? 'VOUS (Prêteur)' : 'VOUS (Emprunteur)'}
      </Text>
      
      <TouchableOpacity 
        style={s.contratBtn}
        onPress={() => handleVoirContrat(item.id)}
      >
        <Text style={s.contratBtnT}>📄 Voir Contrat Bilingue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Profile')}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Mes Transactions</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>Aucune transaction en cours.</Text>}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 16 },
  headerT: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  id: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  statut: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statutOk: { backgroundColor: '#dcfce7', color: '#15803d' },
  statutWait: { backgroundColor: '#fef3c7', color: '#b45309' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  itemRole: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  contratBtn: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, alignItems: 'center' },
  contratBtnT: { color: '#16a34a', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
});
