// =============================================================================
// (tabs)/index.tsx - Écran d'accueil avec liste des annonces
// =============================================================================

import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { getAnnonces } from '../../services/api';
import { colors } from '../../constants/colors';

export default function HomeScreen() {
  // État pour stocker les annonces
  const [annonces, setAnnonces] = useState<any[]>([]);
  
  // État pour le chargement
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =============================================================================
  // CHARGER LES ANNONCES AU DÉMARRAGE
  // =============================================================================

  useEffect(() => {
    chargerAnnonces();
  }, []);

  const chargerAnnonces = async () => {
    try {
      const data = await getAnnonces();
      setAnnonces(data);
    } catch (err) {
      console.log('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RAFraîchir la liste (pull to refresh)
  // =============================================================================

  const onRefresh = async () => {
    setRefreshing(true);
    await chargerAnnonces();
    setRefreshing(false);
  };

  // =============================================================================
  // RENDU D'UNE SEULE ANNONCE
  // =============================================================================

  const renderAnnonce = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.carte}>
      {/* Badge du type d'annonce */}
      <View style={[
        styles.badge, 
        item.type === 'DEMANDE' ? styles.badgeDemande : styles.badgeOffre
      ]}>
        <Text style={styles.badgeTexte}>{item.type}</Text>
      </View>
      
      {/* Titre de l'annonce */}
      <Text style={styles.titre}>{item.titre}</Text>
      
      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      
      {/* Points si c'est une offre */}
      {item.points && (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsTexte}>🎁 {item.points} points</Text>
        </View>
      )}
      
      {/* Informations de l'auteur */}
      <View style={styles.auteur}>
        <Text style={styles.auteurTexte}>Par {item.auteur?.nom || 'Anonyme'}</Text>
      </View>
    </TouchableOpacity>
  );

  // =============================================================================
  // RENDU PRINCIPAL
  // =============================================================================

  if (loading) {
    return (
      <View style={styles.centre}>
        <Text style={styles.chargement}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Liste des annonces */}
      <FlatList
        data={annonces}
        renderItem={renderAnnonce}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Message si aucune annonce
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTexte}>Aucune annonce pour le moment</Text>
            <Text style={styles.videSousTexte}>
              Soyez le premier à créer une annonce !
            </Text>
          </View>
        }
      />
    </View>
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
  liste: {
    padding: 16,
  },
  carte: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeDemande: {
    backgroundColor: '#E3F2FD',
  },
  badgeOffre: {
    backgroundColor: '#E8F5E9',
  },
  badgeTexte: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  titre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  pointsContainer: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pointsTexte: {
    color: '#F57C00',
    fontWeight: '600',
  },
  auteur: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  auteurTexte: {
    fontSize: 12,
    color: colors.textSecondary,
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
  vide: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  videTexte: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  videSousTexte: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
