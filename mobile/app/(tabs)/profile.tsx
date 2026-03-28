// =============================================================================
// (tabs)/profile.tsx - Mon profil et score de solidarité
// =============================================================================

import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMonProfil, logout } from '../../services/api';
import { colors } from '../../constants/colors';

export default function ProfileScreen() {
  // État du profil
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // =============================================================================
  // CHARGER LE PROFIL
  // =============================================================================

  useEffect(() => {
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    try {
      const data = await getMonProfil();
      setProfil(data);
    } catch (err) {
      console.log('Erreur profil');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // DÉCONNEXION
  // =============================================================================

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
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

  // Calcul du score (score fictif pour l'instant)
  const scoreSolidarite = 85;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Photo de profil */}
        <View style={styles.avatar}>
          <Text style={styles.avatarTexte}>
            {profil?.nom?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>

        {/* Nom */}
        <Text style={styles.nom}>{profil?.nom || 'Utilisateur'}</Text>
        
        {/* Email */}
        <Text style={styles.email}>{profil?.email}</Text>

        {/* Carte Score de solidarité */}
        <View style={styles.scoreCarte}>
          <Text style={styles.scoreEmoji}>🏆</Text>
          <Text style={styles.scoreTitre}>Score de Solidarité</Text>
          <Text style={styles.scoreNombre}>{scoreSolidarite}/100</Text>
          <View style={styles.scoreBarre}>
            <View style={[styles.scoreRemplissage, { width: `${scoreSolidarite}%` }]} />
          </View>
          <Text style={styles.scoreLabel}>
            {scoreSolidarite >= 80 ? '🌟 Excellent!' : 
             scoreSolidarite >= 50 ? '👍 Bon parcours' : 
             '💪 Continuez vos efforts'}
          </Text>
        </View>

        {/* Informations */}
        <View style={styles.infoContainer}>
          <View style={styles.infoLigne}>
            <Text style={styles.infoLabel}>CIN</Text>
            <Text style={styles.infoValeur}>{profil?.cin || '-'}</Text>
          </View>
          <View style={styles.infoLigne}>
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValeur}>
              {profil?.createdAt ? new Date(profil.createdAt).toLocaleDateString('fr-FR') : '-'}
            </Text>
          </View>
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity style={styles.deconnexion} onPress={handleLogout}>
          <Text style={styles.deconnexionTexte}>Déconnexion</Text>
        </TouchableOpacity>

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
    padding: 20,
    alignItems: 'center',
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTexte: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  nom: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  scoreCarte: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  scoreTitre: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  scoreNombre: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  scoreBarre: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreRemplissage: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValeur: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deconnexion: {
    backgroundColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginTop: 8,
  },
  deconnexionTexte: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
