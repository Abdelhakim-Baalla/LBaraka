// =============================================================================
// (tabs)/create.tsx - Créer une nouvelle annonce
// =============================================================================

import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createAnnonce } from '../../services/api';
import { colors } from '../../constants/colors';

export default function CreateScreen() {
  // État du formulaire
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'DEMANDE' | 'OFFRE'>('DEMANDE');
  const [points, setPoints] = useState('');
  
  // État du chargement
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // =============================================================================
  // FONCTION DE CRÉATION
  // =============================================================================

  const handleCreate = async () => {
    // Validation
    if (!titre.trim() || !description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et la description');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        titre: titre.trim(),
        description: description.trim(),
        type,
      };

      // Si c'est une offre, ajouter les points
      if (type === 'OFFRE' && points) {
        data.points = parseInt(points);
      }

      // Envoyer à l'API
      await createAnnonce(data);

      // Message de succès
      Alert.alert('Succès', 'Votre annonce a été créée !', [
        {
          text: 'OK',
          onPress: () => {
            // Réinitialiser le formulaire
            setTitre('');
            setDescription('');
            setPoints('');
            // Retourner à l'accueil
            router.push('/(tabs)');
          },
        },
      ]);
      
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDU DE L'INTERFACE
  // =============================================================================

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        {/* Titre */}
        <Text style={styles.label}>Titre de l'annonce *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Besoin d'aide pour mes courses"
          value={titre}
          onChangeText={setTitre}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez votre demande ou votre offre en détail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Type d'annonce */}
        <Text style={styles.label}>Type d'annonce</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeBouton,
              type === 'DEMANDE' && styles.typeBoutonActif,
            ]}
            onPress={() => setType('DEMANDE')}
          >
            <Text style={[
              styles.typeTexte,
              type === 'DEMANDE' && styles.typeTexteActif,
            ]}>
              📢 Demande
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeBouton,
              type === 'OFFRE' && styles.typeBoutonActif,
            ]}
            onPress={() => setType('OFFRE')}
          >
            <Text style={[
              styles.typeTexte,
              type === 'OFFRE' && styles.typeTexteActif,
            ]}>
              🎁 Offre
            </Text>
          </TouchableOpacity>
        </View>

        {/* Points (uniquement pour les offres) */}
        {type === 'OFFRE' && (
          <>
            <Text style={styles.label}>Points à récompenser</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
            />
            <Text style={styles.aide}>
              Ces points seront débités de votre wallet
            </Text>
          </>
        )}

        {/* Bouton de création */}
        <TouchableOpacity
          style={[styles.bouton, loading && styles.boutonDesactive]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.boutonTexte}>
            {loading ? 'Création...' : 'Publier l\'annonce'}
          </Text>
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
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typeBouton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBoutonActif: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  typeTexte: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTexteActif: {
    color: colors.primary,
  },
  aide: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bouton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  boutonDesactive: {
    backgroundColor: colors.textSecondary,
  },
  boutonTexte: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
