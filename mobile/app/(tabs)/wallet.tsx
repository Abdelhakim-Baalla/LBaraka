// =============================================================================
// (tabs)/wallet.tsx - Mon wallet et mes points
// =============================================================================

import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { getWallet } from '../../services/api';
import { colors } from '../../constants/colors';

export default function WalletScreen() {
  // État du wallet
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =============================================================================
  // CHARGER LE WALLET
  // =============================================================================

  useEffect(() => {
    chargerWallet();
  }, []);

  const chargerWallet = async () => {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch (err) {
      console.log('Erreur wallet');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await chargerWallet();
    setRefreshing(false);
  };

  // =============================================================================
  // RENDU DE L'INTERFACE
  // =============================================================================

  if (loading) {
    return (
      <View style={styles.centre}>
        <Text style={styles.chargement}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        
        {/* Carte principale du wallet */}
        <View style={styles.carte}>
          <Text style={styles.carteTitre}>Mon Solde</Text>
          <Text style={styles.carteSolde}>{wallet?.solde || 0}</Text>
          <Text style={styles.carteUnite}>points disponibles</Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNombre}>{wallet?.annoncesCrees || 0}</Text>
            <Text style={styles.statLabel}>Annonces créées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNombre}>{wallet?.aidesRecues || 0}</Text>
            <Text style={styles.statLabel}>Aides reçues</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNombre}>{wallet?.aidesDonnees || 0}</Text>
            <Text style={styles.statLabel}>Aides données</Text>
          </View>
        </View>

        {/* Historique des transactions */}
        <Text style={styles.sectionTitre}>Historique</Text>
        
        {wallet?.transactions?.length > 0 ? (
          wallet.transactions.map((tx: any, index: number) => (
            <View key={index} style={styles.transaction}>
              <View style={styles.txIcon}>
                <Text>{tx.type === 'CREDIT' ? '📈' : '📉'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitre}>{tx.description}</Text>
                <Text style={styles.txDate}>
                  {new Date(tx.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[
                styles.txMontant,
                tx.type === 'CREDIT' ? styles.txPlus : styles.txMoins
              ]}>
                {tx.type === 'CREDIT' ? '+' : '-'}{tx.montant}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.vide}>
            <Text style={styles.videTexte}>Aucune transaction</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  centre: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargement: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  carte: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  carteTitre: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  carteSolde: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  carteUnite: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  statNombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txTitre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txMontant: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  txPlus: {
    color: colors.success,
  },
  txMoins: {
    color: colors.error,
  },
  vide: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  videTexte: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
