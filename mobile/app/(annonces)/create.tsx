import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, Tag } from '../../components/ui/Chip';
import { TextField } from '../../components/ui/TextField';
import { T } from '../../components/ui/T';
import { SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

const CATEGORIES = ['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const MODES = ['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'];
const CONDITIONS = ['NEUF', 'BON_ETAT', 'USE'];

const STEP_TITLES = ['Votre objet', 'Photos', 'Conditions'];
const STEP_BODIES = [
  'Décrivez votre objet et précisez sa catégorie.',
  'Ajoutez exactement 3 photos nettes de votre objet.',
  'Fixez le mode, les montants et la localisation.',
];

export default function CreateAnnonceScreen() {
  const router = useRouter();
  const { c } = useTheme();

  const [step, setStep] = useState(0);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('POUSSETTE');
  const [mode, setMode] = useState('DON_GRATUIT');
  const [condition, setCondition] = useState('BON_ETAT');
  const [prixSymbolique, setPrixSymbolique] = useState('');
  const [montantCaution, setMontantCaution] = useState('');
  const [latitude, setLatitude] = useState('33.58');
  const [longitude, setLongitude] = useState('-7.60');
  const [isFoodRescue, setIsFoodRescue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photosBase64, setPhotosBase64] = useState<Array<{ name: string; type: string; base64: string }>>([]);

  // Estime la taille en octets d'une chaîne Base64
  const estimateBase64Bytes = (base64: string) => {
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  };

  // Sélectionne des photos depuis la galerie
  const pickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'Autorisez la galerie pour sélectionner vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
        selectionLimit: 3,
      });

      if (result.canceled) {
        return;
      }

      const mapped = result.assets
        .slice(0, 3)
        .map((asset, index) => ({
          name: asset.fileName || `gallery-${Date.now()}-${index + 1}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          base64: asset.base64 || '',
        }))
        .filter((asset) => asset.base64.length > 0);

      const hasBigPhoto = mapped.some((photo) => estimateBase64Bytes(photo.base64) > 6 * 1024 * 1024);
      if (hasBigPhoto) {
        Alert.alert('Photo trop grande', 'Une photo dépasse 6MB. Choisissez des photos plus légères.');
        return;
      }

      setPhotosBase64(mapped);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie.');
    }
  };

  // Prend une photo avec la caméra
  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'Autorisez la caméra pour prendre des photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const next = [...photosBase64];

      if (next.length >= 3) {
        Alert.alert('Limite atteinte', 'Maximum 3 photos.');
        return;
      }

      if (!asset.base64) {
        Alert.alert('Erreur', 'Photo invalide. Réessayez.');
        return;
      }

      if (estimateBase64Bytes(asset.base64) > 6 * 1024 * 1024) {
        Alert.alert('Photo trop grande', 'La photo dépasse 6MB. Reprenez une photo plus légère.');
        return;
      }

      next.push({
        name: asset.fileName || `camera-${Date.now()}-${next.length + 1}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        base64: asset.base64,
      });

      setPhotosBase64(next);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra.');
    }
  };

  // Utilise la position GPS actuelle
  const useCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation pour utiliser votre position réelle.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer votre localisation.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Soumet le formulaire de création d'annonce
  const handleSubmit = async () => {
    if (!titre.trim() || !description.trim()) {
      Alert.alert('Validation', 'Titre et description sont obligatoires.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert('Validation', 'Latitude et longitude doivent être des nombres valides.');
      return;
    }

    if (photosBase64.length !== 3) {
      Alert.alert('Validation', 'Veuillez sélectionner exactement 3 photos.');
      return;
    }

    const totalBytes = photosBase64.reduce((sum, photo) => sum + estimateBase64Bytes(photo.base64), 0);
    if (totalBytes > 18 * 1024 * 1024) {
      Alert.alert('Payload trop grand', 'Les 3 photos sont trop lourdes. Choisissez des images plus légères.');
      return;
    }

    const token = await AsyncStorage.getItem('accessToken');
    const userRaw = await AsyncStorage.getItem('user');

    if (!token) {
      Alert.alert('Session', 'Vous devez vous connecter.');
      router.replace('/(auth)/sign-in');
      return;
    }

    const user = userRaw ? JSON.parse(userRaw) : null;
    const isPartenaire = user?.role === 'PARTENAIRE';

    if (isFoodRescue && !isPartenaire) {
      Alert.alert('Autorisation', 'Seul un compte PARTENAIRE peut publier un Food Rescue.');
      return;
    }

    const payload: any = {
      titre: titre.trim(),
      description: description.trim(),
      categorie,
      mode,
      condition,
      geolocalisation: [lat, lng],
      photosBase64,
      isFoodRescue,
    };

    if (isFoodRescue) {
      payload.categorie = 'NOURRITURE';
      payload.mode = 'DON_GRATUIT';
    }

    if (prixSymbolique.trim()) {
      payload.prixSymbolique = Number(prixSymbolique);
    }

    if (montantCaution.trim()) {
      payload.montantCaution = Number(montantCaution);
    }

    setIsSubmitting(true);

    try {
      if (isFoodRescue) {
        await ApiService.createFoodRescueAnnonce(token, payload);
      } else {
        await ApiService.createAnnonce(token, payload);
      }

      Alert.alert('Succès', 'Annonce créée avec succès.', [
        {
          text: 'Voir mes annonces',
          onPress: () => router.replace('/(annonces)/mine'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de créer l\'annonce.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!titre.trim() || !description.trim()) {
        Alert.alert('Validation', 'Titre et description sont obligatoires.');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (photosBase64.length !== 3) {
        Alert.alert('Validation', 'Veuillez sélectionner exactement 3 photos.');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const progress = ((step + 1) / 3) * 100;

  return (
    <Screen scroll>
      <Enter index={0}>
        <View style={{ marginTop: 8 }}>
          <T kind="overline" color={c.primary}>Étape {step + 1}/3</T>
          <T kind="h1" style={{ marginTop: 6 }}>{STEP_TITLES[step]}</T>
          <T kind="body" color={c.muted} style={{ marginTop: 6 }}>
            {STEP_BODIES[step]}
          </T>
          <View
            style={{
              marginTop: 14,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: c.surface2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: radius.pill,
                backgroundColor: c.primary,
              }}
            />
          </View>
        </View>
      </Enter>

      {step === 0 && (
        <>
          <Enter index={1}>
            <Card style={{ marginTop: 20, gap: 16 }}>
              <TextField
                label="Titre"
                icon="text-outline"
                value={titre}
                onChangeText={setTitre}
                placeholder="Ex: Poussette en bon état"
              />
              <TextField
                label="Description"
                icon="document-text-outline"
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre annonce"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card>
          </Enter>
          <Enter index={2}>
            <View style={{ marginTop: 24 }}>
              <SectionHeader title="Catégorie" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {CATEGORIES.map((item) => (
                  <Chip key={item} label={item} selected={categorie === item} onPress={() => setCategorie(item)} />
                ))}
              </View>
            </View>
          </Enter>
          <Enter index={3}>
            <View style={{ marginTop: 24 }}>
              <SectionHeader title="État" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {CONDITIONS.map((item) => (
                  <Chip key={item} label={item} selected={condition === item} onPress={() => setCondition(item)} />
                ))}
              </View>
            </View>
          </Enter>
        </>
      )}

      {step === 1 && (
        <>
          <Enter index={1}>
            <Card style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T kind="h3">Photos de l&apos;annonce</T>
                <Tag label={`${photosBase64.length}/3`} tone="primary" />
              </View>
              <T kind="small" color={c.muted} style={{ marginTop: 6 }}>
                3 photos obligatoires. Cadrez bien votre objet.
              </T>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                {[0, 1, 2].map((index) => {
                  const photo = photosBase64[index];
                  return (
                    <View key={index} style={{ flex: 1 }}>
                      {photo ? (
                        <View>
                          <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface2 }}>
                            <Image
                              source={{ uri: `data:${photo.type};base64,${photo.base64}` }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          </View>
                          <PressableScale
                            onPress={() => {
                              const clone = [...photosBase64];
                              clone.splice(index, 1);
                              setPhotosBase64(clone);
                            }}
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: c.danger,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="close" size={15} color={c.surface} />
                          </PressableScale>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            aspectRatio: 3 / 4,
                            borderRadius: radius.lg,
                            backgroundColor: c.surface2,
                            borderWidth: 1,
                            borderColor: c.line,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <Ionicons name="image-outline" size={20} color={c.muted} />
                          <T kind="caption" color={c.muted}>Photo {index + 1}</T>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Galerie" size="md" icon="images-outline" fullWidth onPress={pickFromLibrary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Caméra" size="md" variant="secondary" icon="camera-outline" fullWidth onPress={pickFromCamera} />
                </View>
              </View>
              <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
                {photosBase64.length}/3 photos sélectionnées
              </T>
            </Card>
          </Enter>
        </>
      )}

      {step === 2 && (
        <>
          <Enter index={1}>
            <View style={{ marginTop: 20 }}>
              <SectionHeader title="Mode d'échange" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {MODES.map((item) => (
                  <Chip key={item} label={item} selected={mode === item} onPress={() => setMode(item)} />
                ))}
              </View>
            </View>
          </Enter>
          <Enter index={2}>
            <Card style={{ marginTop: 20, gap: 16 }}>
              <TextField
                label="Prix symbolique (optionnel)"
                icon="pricetag-outline"
                value={prixSymbolique}
                onChangeText={setPrixSymbolique}
                placeholder="0"
                keyboardType="numeric"
              />
              <TextField
                label="Montant caution (optionnel)"
                icon="shield-checkmark-outline"
                value={montantCaution}
                onChangeText={setMontantCaution}
                placeholder="0"
                keyboardType="numeric"
              />
            </Card>
          </Enter>
          <Enter index={3}>
            <View style={{ marginTop: 24 }}>
              <SectionHeader title="Localisation" />
              <Card style={{ marginTop: 12, gap: 16 }}>
                <TextField
                  label="Latitude"
                  icon="location-outline"
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="33.58"
                  keyboardType="decimal-pad"
                />
                <TextField
                  label="Longitude"
                  icon="location-outline"
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="-7.60"
                  keyboardType="decimal-pad"
                />
                <PressableScale
                  onPress={useCurrentLocation}
                  disabled={isGettingLocation}
                  style={{
                    borderRadius: radius.md,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    backgroundColor: c.surface2,
                    opacity: isGettingLocation ? 0.6 : 1,
                  }}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator color={c.primary} />
                  ) : (
                    <Ionicons name="locate-outline" size={18} color={c.primary} />
                  )}
                  <T kind="bodyStrong" color={c.primary}>
                    {isGettingLocation ? 'Récupération position...' : 'Utiliser ma position réelle'}
                  </T>
                </PressableScale>
              </Card>
            </View>
          </Enter>
          <Enter index={4}>
            <Card style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <T kind="bodyStrong" color={c.primary}>Publier en Food Rescue</T>
                <T kind="small" color={c.muted} style={{ marginTop: 4 }}>
                  Réservé aux comptes PARTENAIRE.
                </T>
              </View>
              <Switch
                value={isFoodRescue}
                onValueChange={setIsFoodRescue}
                trackColor={{ false: c.line, true: c.primary }}
                thumbColor={c.surface}
              />
            </Card>
          </Enter>
        </>
      )}

      <Enter index={5}>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="Retour" variant="ghost" icon="arrow-back" onPress={handleBack} />
          </View>
          <View style={{ flex: 2 }}>
            {step < 2 ? (
              <Button title="Continuer" iconAfter="arrow-forward" onPress={handleNext} />
            ) : (
              <Button
                title={isSubmitting ? 'Publication...' : "Publier l'annonce"}
                icon="checkmark-circle-outline"
                loading={isSubmitting}
                onPress={handleSubmit}
              />
            )}
          </View>
        </View>
      </Enter>
    </Screen>
  );
}
