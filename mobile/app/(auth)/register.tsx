// =============================================================================
// (auth)/register.tsx - Écran d'inscription
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
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { register } from '../../services/api';
import { colors } from '../../constants/colors';

export default function RegisterScreen() {
  // État pour les champs du formulaire
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [cin, setCin] = useState('');
  
  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  // =============================================================================
  // FONCTION DE SOUMISSION DU FORMULAIRE
  // =============================================================================
  
  const handleRegister = async () => {
    // Validation simple
    if (!nom || !email || !motDePasse || !cin) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Appel à l'API d'inscription
      await register(nom, email, motDePasse, cin);
      
      // Si succès → rediriger vers login avec message
      alert('Compte créé ! Vous pouvez maintenant vous connecter.');
      router.replace('/(auth)/login');
      
    } catch (err: any) {
      // Si erreur → afficher le message
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de l\'inscription. Réessayez.');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        
          {/* Titre */}
          <Text style={styles.titre}>Créer un compte</Text>
          <Text style={styles.soustitre}>Rejoignez la communauté LBaraka</Text>

          {/* Message d'erreur */}
          {error ? (
            <View style={styles.erreurBox}>
              <Text style={styles.erreurTexte}>{error}</Text>
            </View>
          ) : null}

          {/* Champ Nom complet */}
          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            placeholder="Ahmed Benali"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
          />

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
            placeholder="Minimum 6 caractères"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry={true}
          />

          {/* Champ CIN */}
          <Text style={styles.label}>CIN (Carte d'identité)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: AB123456"
            value={cin}
            onChangeText={setCin}
            autoCapitalize="characters"
          />

          {/* Bouton S'inscrire */}
          <TouchableOpacity 
            style={styles.bouton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.boutonTexte}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers la connexion */}
          <View style={styles.lienContainer}>
            <Text style={styles.lienTexte}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.lien}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titre: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  soustitre: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
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
