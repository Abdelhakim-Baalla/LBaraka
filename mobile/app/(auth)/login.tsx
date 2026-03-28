// =============================================================================
// (auth)/login.tsx - Écran de connexion
// =============================================================================

import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { login } from '../../services/api';
import { colors } from '../../constants/colors';

export default function LoginScreen() {
  // État pour les champs du formulaire
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  
  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  // =============================================================================
  // FONCTION DE SOUMISSION DU FORMULAIRE
  // =============================================================================
  
  const handleLogin = async () => {
    // Validation simple
    if (!email || !motDePasse) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Appel à l'API de connexion
      await login(email, motDePasse);
      
      // Si succès → rediriger vers home
      router.replace('/(tabs)');
      
    } catch (err: any) {
      // Si erreur → afficher le message
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDU DE L'INTERFACE
  // =============================================================================

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        
        {/* Titre de l'app */}
        <Text style={styles.titre}>LBaraka</Text>
        <Text style={styles.soustitre}>Solidarité de proximité au Maroc</Text>

        {/* Message d'erreur */}
        {error ? (
          <View style={styles.erreurBox}>
            <Text style={styles.erreurTexte}>{error}</Text>
          </View>
        ) : null}

        {/* Champ Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Champ Mot de passe */}
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Votre mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry={true}  // Cache le texte tapé
        />

        {/* Bouton Se connecter */}
        <TouchableOpacity 
          style={styles.bouton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <Text style={styles.boutonTexte}>Se connecter</Text>
          )}
        </TouchableOpacity>

        {/* Lien vers l'inscription */}
        <View style={styles.lienContainer}>
          <Text style={styles.lienTexte}>Pas encore de compte ? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.lien}>S'inscrire</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

// =============================================================================
// STYLES - Simple et lisible
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titre: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  soustitre: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  erreurBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  erreurTexte: {
    color: colors.error,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  bouton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  boutonTexte: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: 'bold',
  },
  lienContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  lienTexte: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  lien: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
