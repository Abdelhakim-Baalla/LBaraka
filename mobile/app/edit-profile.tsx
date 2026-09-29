import { useState, useEffect } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '@/services/api';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadowSm } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { T } from '@/components/ui/T';
import { Avatar, SectionHeader } from '@/components/ui/Primitives';
import { PressableScale } from '@/components/ui/PressableScale';
import { Enter } from '@/components/ui/Enter';

const LANGUES = [
  { value: 'FRANCAIS', short: 'FR', label: 'Français' },
  { value: 'ARABE', short: 'AR', label: 'Arabe' },
  { value: 'AMAZIGH', short: 'AZ', label: 'Amazigh' },
  { value: 'BILINGUE', short: 'BI', label: 'Bilingue' },
];

export default function EditProfile() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [adresseComplete, setAdresseComplete] = useState('');
  const [ville, setVille] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [langueInterface, setLangueInterface] = useState('FRANCAIS');

  // Read-only fields
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setNom(user.profil?.nom || '');
        setPrenom(user.profil?.prenom || '');
        setAdresseComplete(user.profil?.adresseComplete || '');
        setVille(user.profil?.ville || '');
        setLangueInterface(user.profil?.langueInterface || 'FRANCAIS');

        // Read-only fields
        setEmail(user.email || '');
        setTelephone(user.telephone || '');
        setCin(user.profil?.cin || '');

        if (user.profil?.dateNaissance) {
          const date = new Date(user.profil.dateNaissance);
          setDateNaissance(date.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Session expirée. Reconnectez-vous.');
      }

      const data = await ApiService.updateUserProfile(token, {
        nom: nom || undefined,
        prenom: prenom || undefined,
        adresseComplete: adresseComplete || undefined,
        ville: ville || undefined,
        dateNaissance: dateNaissance || undefined,
        langueInterface: langueInterface || undefined,
      });

        const userData = await AsyncStorage.getItem('user');
        const user = JSON.parse(userData || '{}');
        user.profil = data.profil;
        await AsyncStorage.setItem('user', JSON.stringify(user));

        Alert.alert('Succès', 'Profil mis à jour', [
          { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fullName = `${prenom || ''} ${nom || ''}`.trim() || 'Utilisateur';

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
              minHeight: 170,
              paddingTop: insets.top + 12,
              paddingHorizontal: 20,
              paddingBottom: 60,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -70,
                right: -60,
                width: 180,
                height: 180,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -60,
                left: -40,
                width: 150,
                height: 150,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.10)',
              }}
            />
            <Enter index={0}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <PressableScale
                  onPress={() => router.back()}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radius.pill,
                    backgroundColor: 'rgba(255,255,255,0.20)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </PressableScale>
                <View style={{ flex: 1 }}>
                  <T kind="overline" color="#FFFFFF" style={{ opacity: 0.7 }}>
                    Compte
                  </T>
                  <T kind="h1" color="#FFFFFF" style={{ marginTop: 4 }}>
                    Modifier le profil
                  </T>
                </View>
              </View>
            </Enter>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <Enter index={1}>
              <View style={{ marginTop: -36, alignItems: 'center' }}>
                <View
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: radius.pill,
                    backgroundColor: c.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Avatar name={fullName} size={72} />
                </View>
                <T kind="h2" center style={{ marginTop: 12 }} numberOfLines={1}>
                  {fullName}
                </T>
                <T kind="small" color={c.muted} center style={{ marginTop: 4 }}>
                  Les champs sensibles restent protégés et non modifiables.
                </T>
              </View>
            </Enter>

            <Enter index={2}>
              <View style={{ marginTop: 24 }}>
                <SectionHeader title="Informations non modifiables" />
                <Card style={{ marginTop: 12, gap: 12 }}>
                  {email ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: radius.md,
                          backgroundColor: c.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="mail-outline" size={17} color={c.muted} />
                      </View>
                      <T kind="body" numberOfLines={1} style={{ flex: 1 }}>{email}</T>
                    </View>
                  ) : null}
                  {telephone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: radius.md,
                          backgroundColor: c.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="call-outline" size={17} color={c.muted} />
                      </View>
                      <T kind="body" style={{ flex: 1 }}>{telephone}</T>
                    </View>
                  ) : null}
                  {cin ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: radius.md,
                          backgroundColor: c.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="card-outline" size={17} color={c.muted} />
                      </View>
                      <T kind="body" style={{ flex: 1 }}>CIN : {cin}</T>
                    </View>
                  ) : null}
                  {!email && !telephone && !cin ? (
                    <T kind="small" color={c.muted}>Aucune information verrouillée à afficher.</T>
                  ) : null}
                </Card>
              </View>
            </Enter>

            <Enter index={3}>
              <View style={{ marginTop: 24 }}>
                <SectionHeader title="Identité" />
                <Card style={{ marginTop: 12, gap: 16 }}>
                  <TextField
                    label="Prénom"
                    icon="person-outline"
                    value={prenom}
                    onChangeText={setPrenom}
                    placeholder="Votre prénom"
                    editable={!isLoading}
                  />
                  <TextField
                    label="Nom"
                    icon="person-outline"
                    value={nom}
                    onChangeText={setNom}
                    placeholder="Votre nom"
                    editable={!isLoading}
                  />
                </Card>
              </View>
            </Enter>

            <Enter index={4}>
              <View style={{ marginTop: 24 }}>
                <SectionHeader title="Coordonnées" />
                <Card style={{ marginTop: 12, gap: 16 }}>
                  <TextField
                    label="Adresse complète"
                    icon="location-outline"
                    value={adresseComplete}
                    onChangeText={setAdresseComplete}
                    placeholder="Votre adresse"
                    editable={!isLoading}
                    multiline
                  />
                  <TextField
                    label="Ville"
                    icon="business-outline"
                    value={ville}
                    onChangeText={setVille}
                    placeholder="Votre ville"
                    editable={!isLoading}
                  />
                  <TextField
                    label="Date de naissance"
                    icon="calendar-outline"
                    value={dateNaissance}
                    onChangeText={setDateNaissance}
                    placeholder="YYYY-MM-DD"
                    editable={!isLoading}
                  />
                </Card>
              </View>
            </Enter>

            <Enter index={5}>
              <View style={{ marginTop: 24 }}>
                <SectionHeader title="Langue" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {LANGUES.map((lang) => (
                    <View key={lang.value} style={{ ...shadowSm(mode) }}>
                      <Chip
                        label={`${lang.short} ${lang.label}`}
                        selected={langueInterface === lang.value}
                        onPress={() => setLangueInterface(lang.value)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </Enter>

            <Enter index={6}>
              <View style={{ marginTop: 28 }}>
                <Button
                  title="Enregistrer"
                  icon="checkmark-outline"
                  loading={isLoading}
                  onPress={handleSubmit}
                />
              </View>
            </Enter>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
