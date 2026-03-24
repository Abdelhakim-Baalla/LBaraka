import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getWallet, depotWallet } from '../api/wallet';

type Props = { navigate: (s: string) => void };

export default function WalletScreen({ navigate }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [montantDepot, setMontantDepot] = useState('');

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWallet(token!);
      setData(res);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDepot = async () => {
    const amount = Number(montantDepot);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    try {
      await depotWallet(token!, amount);
      setMontantDepot('');
      fetchWallet();
      Alert.alert('Succès', 'Dépôt effectué avec succès');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    }
  };

  if (loading && !data) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Profile')}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Mon Wallet</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.balancesContainer}>
        <View style={s.balanceCard}>
          <Text style={s.balanceTitle}>Solde Réel</Text>
          <Text style={s.balanceAmount}>{data?.wallet?.soldeReel} MAD</Text>
        </View>
        <View style={[s.balanceCard, s.blockedCard]}>
          <Text style={s.balanceTitle}>Solde Bloqué (Caution)</Text>
          <Text style={s.balanceAmount}>{data?.wallet?.soldeBloque} MAD</Text>
        </View>
      </View>

      <View style={s.actionContainer}>
        <Text style={s.actionTitle}>Recharger mon compte</Text>
        <View style={s.depotRow}>
          <TextInput
            style={s.input}
            placeholder="Montant (ex: 50)"
            keyboardType="numeric"
            value={montantDepot}
            onChangeText={setMontantDepot}
          />
          <TouchableOpacity style={s.depotBtn} onPress={handleDepot}>
            <Text style={s.depotBtnText}>Déposer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.historyTitle}>Historique des transactions</Text>
      <FlatList
        data={data?.mouvements || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View>
              <Text style={s.itemType}>{item.type}</Text>
              <Text style={s.itemDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[s.itemAmount, item.type === 'DEPOT' || item.type === 'DEBLOCAGE' ? s.amountPos : s.amountNeg]}>
              {item.type === 'DEPOT' || item.type === 'DEBLOCAGE' ? '+' : '-'}{item.montant} MAD
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucun mouvement.</Text>}
        refreshing={loading}
        onRefresh={fetchWallet}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 16 },
  headerT: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  balancesContainer: { padding: 16, flexDirection: 'row', gap: 12 },
  balanceCard: { flex: 1, backgroundColor: '#16a34a', padding: 20, borderRadius: 12, alignItems: 'center' },
  blockedCard: { backgroundColor: '#d97706' },
  balanceTitle: { color: '#dcfce7', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  balanceAmount: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  actionContainer: { padding: 16, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#374151' },
  depotRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 16 },
  depotBtn: { backgroundColor: '#16a34a', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  depotBtnText: { color: '#fff', fontWeight: 'bold' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginLeft: 16, marginTop: 10 },
  item: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemType: { fontSize: 15, fontWeight: 'bold', color: '#374151', textTransform: 'capitalize' },
  itemDate: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  itemAmount: { fontSize: 16, fontWeight: 'bold' },
  amountPos: { color: '#16a34a' },
  amountNeg: { color: '#ef4444' },
  empty: { textAlign: 'center', marginTop: 20, color: '#6b7280' },
});
