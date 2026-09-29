import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '@/services/api';
import { useTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Enter } from '@/components/ui/Enter';
import { T } from '@/components/ui/T';
import { PressableScale } from '@/components/ui/PressableScale';

export default function SignUp() {
  const router = useRouter();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    if (telephone.length < 9) {
      setError('Numéro de téléphone invalide');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const phoneNumber = telephone.startsWith('0') ? telephone : `0${telephone}`;
      const result = await ApiService.registerWithBackend({
        email,
        telephone: phoneNumber,
        cin: cin || undefined,
        motDePasse: password,
      });
      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.utilisateur || result.user));
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)/home');
      } else {
        setError('Inscription échouée : aucun token reçu');
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View
            style={{
              backgroundColor: c.primary,
              minHeight: 290,
              paddingTop: insets.top + 12,
              paddingHorizontal: 20,
              paddingBottom: 68,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 220,
                height: 220,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 110,
                right: 70,
                width: 110,
                height: 110,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -70,
                left: -50,
                width: 170,
                height: 170,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <Enter index={0}>
              <PressableScale
                onPress={() => router.back()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(255,255,255,0.20)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}
              >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </PressableScale>
            </Enter>
            <Enter index={1}>
              <View style={{ marginTop: 22 }}>
                <T kind="overline" color="#FFFFFF" style={{ opacity: 0.7 }}>
                  Inscription
                </T>
                <T kind="display" color="#FFFFFF" style={{ marginTop: 8 }}>
                  Rejoignez LBaraka
                </T>
                <T kind="body" color="#FFFFFF" style={{ marginTop: 8, opacity: 0.85 }}>
                  Un compte, tout le quartier
                </T>
              </View>
            </Enter>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <Enter index={2}>
              <Card style={{ marginTop: -44, borderRadius: radius.xl, padding: 22, gap: 16 }}>
                {error ? (
                  <View
                    style={{
                      backgroundColor: c.dangerSoft,
                      borderRadius: radius.md,
                      padding: 14,
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Ionicons name="alert-circle" size={20} color={c.danger} style={{ marginTop: 1 }} />
                    <T kind="bodyStrong" color={c.onDangerSoft} style={{ flex: 1 }}>
                      {error}
                    </T>
                  </View>
                ) : null}
                <TextField
                  label="Adresse email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nom@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TextField
                  label="Téléphone"
                  icon="call-outline"
                  value={telephone}
                  onChangeText={setTelephone}
                  placeholder="06 12 34 56 78"
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
                <TextField
                  label="CIN (optionnel)"
                  icon="id-card-outline"
                  value={cin}
                  onChangeText={setCin}
                  placeholder="AB123456"
                  autoCapitalize="characters"
                  editable={!isLoading}
                />
                <TextField
                  label="Mot de passe"
                  icon="lock-closed-outline"
                  secure
                  value={password}
                  onChangeText={setPassword}
                  placeholder="6 caractères minimum"
                  editable={!isLoading}
                  onSubmitEditing={handleRegister}
                />
                <Button
                  title="Créer mon compte"
                  iconAfter="arrow-forward"
                  loading={isLoading}
                  onPress={handleRegister}
                />
              </Card>
            </Enter>

            <Enter index={3}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
                <T kind="overline" color={c.muted}>
                  Déjà membre ?
                </T>
                <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
              </View>
              <Button
                title="Se connecter"
                variant="secondary"
                disabled={isLoading}
                onPress={() => router.push('/(auth)/sign-in')}
              />
            </Enter>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
