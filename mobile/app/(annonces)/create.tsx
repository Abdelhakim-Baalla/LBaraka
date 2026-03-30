import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../../services/api';

const CATEGORIES = ['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const MODES = ['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'];
const CONDITIONS = ['NEUF', 'BON_ETAT', 'USE'];

export default function CreateAnnonceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          <Text className="text-base font-extrabold text-primary">Nouvelle annonce</Text>
          <Text className="text-sm text-on-surface-variant mt-1">Formulaire simple pour tester rapidement le backend annonces.</Text>
        </View>

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Titre</Text>
        <TextInput
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex: Poussette en bon état"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre annonce"
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

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Prix symbolique (optionnel)</Text>
        <TextInput
          value={prixSymbolique}
          onChangeText={setPrixSymbolique}
          placeholder="0"
          keyboardType="numeric"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Montant caution (optionnel)</Text>
        <TextInput
          value={montantCaution}
          onChangeText={setMontantCaution}
          placeholder="0"
          keyboardType="numeric"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Latitude</Text>
        <TextInput
          value={latitude}
          onChangeText={setLatitude}
          placeholder="33.58"
          keyboardType="decimal-pad"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Text className="text-xs font-bold text-on-surface-variant mb-1">Longitude</Text>
        <TextInput
          value={longitude}
          onChangeText={setLongitude}
          placeholder="-7.60"
          keyboardType="decimal-pad"
          className="bg-white border border-outline-variant rounded-xl px-3 py-3 mb-3"
        />

        <Pressable
          onPress={useCurrentLocation}
          disabled={isGettingLocation}
          className={`rounded-xl py-3 items-center justify-center flex-row gap-2 mb-3 ${isGettingLocation ? 'bg-surface-container' : 'bg-white border border-outline-variant'}`}
        >
          {isGettingLocation ? <ActivityIndicator color="#1B4332" /> : <Ionicons name="locate-outline" size={18} color="#1B4332" />}
          <Text className="text-primary font-bold">{isGettingLocation ? 'Récupération position...' : 'Utiliser ma position réelle'}</Text>
        </Pressable>

        <View className="bg-white border border-outline-variant rounded-xl p-3 mb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-bold text-primary">Publier en Food Rescue</Text>
            <Text className="text-xs text-on-surface-variant mt-1">Réservé aux comptes PARTENAIRE.</Text>
          </View>
          <Switch value={isFoodRescue} onValueChange={setIsFoodRescue} />
        </View>

        <View className="bg-white border border-outline-variant rounded-xl p-3 mb-4">
          <Text className="text-xs font-bold text-primary mb-2">Photos de l'annonce (3 obligatoires)</Text>

          <View className="flex-row gap-2 mb-3">
            <Pressable onPress={pickFromLibrary} className="flex-1 bg-primary rounded-lg py-3 items-center">
              <Text className="text-white font-bold text-xs">Choisir galerie</Text>
            </Pressable>
            <Pressable onPress={pickFromCamera} className="flex-1 bg-white border border-outline-variant rounded-lg py-3 items-center">
              <Text className="text-primary font-bold text-xs">Prendre photo</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            {[0, 1, 2].map((index) => {
              const photo = photosBase64[index];
              return (
                <View key={index} className="flex-1">
                  {photo ? (
                    <View className="relative">
                      <Image
                        source={{ uri: `data:${photo.type};base64,${photo.base64}` }}
                        className="w-full h-20 rounded-lg"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => {
                          const clone = [...photosBase64];
                          clone.splice(index, 1);
                          setPhotosBase64(clone);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full items-center justify-center"
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ) : (
                    <View className="w-full h-20 rounded-lg bg-surface-container items-center justify-center border border-outline-variant">
                      <Ionicons name="image-outline" size={18} color="#717973" />
                      <Text className="text-[10px] text-on-surface-variant mt-1">Photo {index + 1}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text className="text-xs text-on-surface-variant mt-2">{photosBase64.length}/3 photos sélectionnées</Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-3 ${isSubmitting ? 'bg-primary/60' : 'bg-primary'}`}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
          <Text className="text-white font-bold">{isSubmitting ? 'Publication...' : 'Publier l\'annonce'}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          className="bg-white border border-outline-variant rounded-xl py-3.5 items-center justify-center flex-row gap-2"
        >
          <Ionicons name="arrow-back" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Retour à l'accueil</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
