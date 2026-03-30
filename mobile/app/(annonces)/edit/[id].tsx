import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../../../services/api';
import SmartAnnonceImage from '../../../components/smart-annonce-image';

const CATEGORIES = ['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const MODES = ['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'];
const CONDITIONS = ['NEUF', 'BON_ETAT', 'USE'];
const PHOTO_SLOTS_COUNT = 3;

export default function EditAnnonceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();

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
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 10 }}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <Pressable
          onPress={() => router.back()}
          className="bg-white border border-outline-variant rounded-xl py-3 px-3 flex-row items-center gap-2 mb-3"
        >
          <Ionicons name="arrow-back" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Retour</Text>
        </Pressable>

        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
          <Text className="text-lg font-extrabold text-primary">Modifier annonce</Text>
          <Text className="text-sm text-on-surface-variant mt-1">Mettez à jour les informations de votre annonce.</Text>
        </View>

        {existingPhotos && existingPhotos.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-on-surface-variant mb-2">Photos actuelles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {existingPhotos.map((photo, index) => (
                <SmartAnnonceImage
                  key={`photo-${index}`}
                  uri={photo}
                  className="w-28 h-28 rounded-xl overflow-hidden"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-xs font-bold text-on-surface-variant mb-2">Remplacer les photos une par une</Text>
          <View className="gap-3">
            {getPhotoSlots().map((photo, index) => {
              const newPhoto = newPhotosByIndex[index];

              return (
                <View key={`replace-photo-${index}`} className="bg-white border border-outline-variant rounded-xl p-3">
                  <Text className="text-[11px] text-on-surface-variant mb-2">Photo {index + 1}</Text>

                  <View className="w-full h-32 rounded-xl overflow-hidden border border-outline-variant mb-2">
                    {newPhoto ? (
                      <Image
                        source={{ uri: `data:${newPhoto.type};base64,${newPhoto.base64}` }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      photo ? (
                        <SmartAnnonceImage uri={photo} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full bg-surface items-center justify-center">
                          <Text className="text-xs text-on-surface-variant">Aucune photo</Text>
                        </View>
                      )
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => pickPhotoForIndex(index, 'gallery')}
                      className="flex-1 bg-primary/10 rounded-lg py-2 flex-row items-center justify-center gap-1"
                    >
                      <Ionicons name="images-outline" size={14} color="#1B4332" />
                      <Text className="text-primary text-xs font-bold">Galerie</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => pickPhotoForIndex(index, 'camera')}
                      className="flex-1 bg-primary/10 rounded-lg py-2 flex-row items-center justify-center gap-1"
                    >
                      <Ionicons name="camera-outline" size={14} color="#1B4332" />
                      <Text className="text-primary text-xs font-bold">Caméra</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Titre</Text>
        <TextInput value={titre} onChangeText={setTitre} className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3" />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-2">Catégorie</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategorie(item)}
              className={`px-3 py-2 rounded-lg border ${categorie === item ? 'bg-primary border-primary' : 'bg-white border-outline-variant'}`}
            >
              <Text className={`${categorie === item ? 'text-white' : 'text-on-surface'} text-xs font-bold`}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-bold text-on-surface-variant mb-2">Mode d'échange</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {MODES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              className={`px-3 py-2 rounded-lg border ${mode === item ? 'bg-primary border-primary' : 'bg-white border-outline-variant'}`}
            >
              <Text className={`${mode === item ? 'text-white' : 'text-on-surface'} text-xs font-bold`}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-bold text-on-surface-variant mb-2">État</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {CONDITIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCondition(item)}
              className={`px-3 py-2 rounded-lg border ${condition === item ? 'bg-primary border-primary' : 'bg-white border-outline-variant'}`}
            >
              <Text className={`${condition === item ? 'text-white' : 'text-on-surface'} text-xs font-bold`}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Prix symbolique</Text>
        <TextInput
          value={prixSymbolique}
          onChangeText={setPrixSymbolique}
          keyboardType="numeric"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Montant caution</Text>
        <TextInput
          value={montantCaution}
          onChangeText={setMontantCaution}
          keyboardType="numeric"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Latitude</Text>
        <TextInput
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Longitude</Text>
        <TextInput
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-4"
        />

        <Pressable
          onPress={saveAnnonce}
          disabled={isSaving}
          className={`rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3 ${isSaving ? 'bg-primary/60' : 'bg-primary'}`}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
          <Text className="text-white font-bold">{isSaving ? 'Enregistrement...' : 'Enregistrer les changements'}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="bg-white border border-outline-variant rounded-xl py-4 items-center justify-center flex-row gap-2"
        >
          <Ionicons name="arrow-back" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Retour</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
