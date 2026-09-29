import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../../../services/api';
import SmartAnnonceImage from '../../../components/smart-annonce-image';
import { useTheme } from '../../../theme/ThemeContext';
import { radius } from '../../../theme/tokens';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import { TextField } from '../../../components/ui/TextField';
import { T } from '../../../components/ui/T';
import { SectionHeader } from '../../../components/ui/Primitives';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Enter } from '../../../components/ui/Enter';

const CATEGORIES = ['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const MODES = ['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'];
const CONDITIONS = ['NEUF', 'BON_ETAT', 'USE'];
const PHOTO_SLOTS_COUNT = 3;

export default function EditAnnonceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('POUSSETTE');
  const [mode, setMode] = useState('DON_GRATUIT');
  const [condition, setCondition] = useState('BON_ETAT');
  const [prixSymbolique, setPrixSymbolique] = useState('');
  const [montantCaution, setMontantCaution] = useState('');
  const [latitude, setLatitude] = useState('33.58');
  const [longitude, setLongitude] = useState('-7.60');
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotosByIndex, setNewPhotosByIndex] = useState<Record<number, { name: string; type: string; base64: string; index: number }>>({});

  const getPhotoSlots = () => {
    const slots: string[] = [];
    for (let i = 0; i < PHOTO_SLOTS_COUNT; i++) {
      slots.push(existingPhotos[i] || '');
    }
    return slots;
  };

  const estimateBase64Bytes = (base64: string) => {
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  };

  const pickPhotoForIndex = async (index: number, source: 'camera' | 'gallery') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', source === 'camera' ? 'Autorisez la caméra.' : 'Autorisez la galerie.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.5,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.5,
            base64: true,
            selectionLimit: 1,
          });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.base64) {
        Alert.alert('Validation', 'Aucune photo valide sélectionnée.');
        return;
      }

      if (estimateBase64Bytes(asset.base64) > 6 * 1024 * 1024) {
        Alert.alert('Photo trop grande', 'Cette photo dépasse 6MB.');
        return;
      }

      setNewPhotosByIndex((prev) => ({
        ...prev,
        [index]: {
          name: asset.fileName || `edit-${source}-${Date.now()}-${index + 1}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          base64: asset.base64 as string,
          index,
        },
      }));
    } catch {
      Alert.alert('Erreur', source === 'camera' ? 'Impossible d\'ouvrir la caméra.' : 'Impossible d\'ouvrir la galerie.');
    }
  };

  const loadAnnonce = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnonceById(token, String(params.id || ''));
      const annonce = data.annonce;

      setTitre(String(annonce.titre || ''));
      setDescription(String(annonce.description || ''));
      setCategorie(String(annonce.categorie || 'POUSSETTE'));
      setMode(String(annonce.mode || 'DON_GRATUIT'));
      setCondition(String(annonce.condition || 'BON_ETAT'));
      setPrixSymbolique(annonce.prixSymbolique !== null && annonce.prixSymbolique !== undefined ? String(annonce.prixSymbolique) : '');
      setMontantCaution(annonce.montantCaution !== null && annonce.montantCaution !== undefined ? String(annonce.montantCaution) : '');
      setLatitude(String(annonce.geolocalisation?.[0] ?? 33.58));
      setLongitude(String(annonce.geolocalisation?.[1] ?? -7.60));
      setExistingPhotos(annonce.photos || []);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de charger cette annonce.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadAnnonce();
    }, [params.id])
  );

  const saveAnnonce = async () => {
    if (!titre.trim() || !description.trim()) {
      Alert.alert('Validation', 'Titre et description sont obligatoires.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert('Validation', 'Latitude et longitude invalides.');
      return;
    }

    const payload: any = {
      titre: titre.trim(),
      description: description.trim(),
      categorie,
      mode,
      condition,
      geolocalisation: [lat, lng],
    };

    if (prixSymbolique.trim()) {
      payload.prixSymbolique = Number(prixSymbolique);
    }

    if (montantCaution.trim()) {
      payload.montantCaution = Number(montantCaution);
    }

    const replacedPhotos = Object.values(newPhotosByIndex);
    if (replacedPhotos.length > 0) {
      payload.photos = getPhotoSlots();
      payload.photosBase64 = replacedPhotos;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      await ApiService.updateAnnonce(token, String(params.id || ''), payload);
      Alert.alert('Succès', 'Annonce modifiée avec succès.', [
        { text: 'OK', onPress: () => router.replace('/(annonces)/mine') },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de modifier l\'annonce.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement de l'annonce...
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Enter index={0}>
        <View style={{ marginTop: 8 }}>
          <T kind="overline" color={c.primary}>Édition</T>
          <T kind="h1" style={{ marginTop: 6 }}>Modifier annonce</T>
          <T kind="body" color={c.muted} style={{ marginTop: 6 }}>
            Mettez à jour les informations de votre annonce.
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
              style={{ width: '100%', height: '100%', borderRadius: radius.pill, backgroundColor: c.primary }}
            />
          </View>
        </View>
      </Enter>

      <Enter index={1}>
        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Photos" />
          {existingPhotos && existingPhotos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
              style={{ marginTop: 12, marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              {existingPhotos.map((photo, index) => (
                <View
                  key={`photo-${index}`}
                  style={{ width: 140, aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface2 }}
                >
                  <SmartAnnonceImage uri={photo} className="w-full h-full" resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <T kind="small" color={c.muted} style={{ marginTop: 8 }}>
              Aucune photo enregistrée pour le moment.
            </T>
          )}
          <View style={{ gap: 12, marginTop: 12 }}>
            {getPhotoSlots().map((photo, index) => {
              const newPhoto = newPhotosByIndex[index];
              return (
                <Card key={`replace-photo-${index}`} pad={14}>
                  <T kind="caption" color={c.muted}>Photo {index + 1}</T>
                  <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface2, marginTop: 10 }}>
                    {newPhoto ? (
                      <Image
                        source={{ uri: `data:${newPhoto.type};base64,${newPhoto.base64}` }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      photo ? (
                        <SmartAnnonceImage uri={photo} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                          <T kind="small" color={c.muted}>Aucune photo</T>
                        </View>
                      )
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Button title="Galerie" size="md" variant="secondary" icon="images-outline" onPress={() => pickPhotoForIndex(index, 'gallery')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Caméra" size="md" variant="secondary" icon="camera-outline" onPress={() => pickPhotoForIndex(index, 'camera')} />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </Enter>

      <Enter index={2}>
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Objet" />
          <Card style={{ marginTop: 12, gap: 16 }}>
            <TextField label="Titre" icon="text-outline" value={titre} onChangeText={setTitre} />
            <TextField
              label="Description"
              icon="document-text-outline"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View>
              <T kind="caption" color={c.muted}>Catégorie</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {CATEGORIES.map((item) => (
                  <Chip key={item} label={item} selected={categorie === item} onPress={() => setCategorie(item)} />
                ))}
              </View>
            </View>
            <View>
              <T kind="caption" color={c.muted}>État</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {CONDITIONS.map((item) => (
                  <Chip key={item} label={item} selected={condition === item} onPress={() => setCondition(item)} />
                ))}
              </View>
            </View>
          </Card>
        </View>
      </Enter>

      <Enter index={3}>
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Conditions" />
          <Card style={{ marginTop: 12, gap: 16 }}>
            <View>
              <T kind="caption" color={c.muted}>Mode d&apos;échange</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {MODES.map((item) => (
                  <Chip key={item} label={item} selected={mode === item} onPress={() => setMode(item)} />
                ))}
              </View>
            </View>
            <TextField
              label="Prix symbolique"
              icon="pricetag-outline"
              value={prixSymbolique}
              onChangeText={setPrixSymbolique}
              keyboardType="numeric"
            />
            <TextField
              label="Montant caution"
              icon="shield-checkmark-outline"
              value={montantCaution}
              onChangeText={setMontantCaution}
              keyboardType="numeric"
            />
            <TextField
              label="Latitude"
              icon="location-outline"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Longitude"
              icon="location-outline"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="decimal-pad"
            />
          </Card>
        </View>
      </Enter>

      <Enter index={4}>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="Retour" variant="ghost" icon="arrow-back" onPress={() => router.back()} />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
              icon="save-outline"
              loading={isSaving}
              onPress={saveAnnonce}
            />
          </View>
        </View>
      </Enter>
    </Screen>
  );
}
