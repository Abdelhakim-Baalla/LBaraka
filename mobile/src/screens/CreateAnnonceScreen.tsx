import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { createAnnonce } from '../api/annonces';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

const CATS = ['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];
const MODES = ['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'];
const CONDS = ['NEUF', 'BON_ETAT', 'USE'];

function Chips({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.row}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[s.chip, value === item && s.chipOn]}
          onPress={() => onChange(item)}
        >
          <Text style={[s.chipT, value === item && s.chipTOn]}>
            {item.replace(/_/g, ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CreateAnnonceScreen({ navigate }: Props) {
  const { token } = useAuth();
  const [titre, setTitre] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const [mode, setMode] = useState(MODES[0]);
  const [cond, setCond] = useState(CONDS[0]);
  const [prix, setPrix] = useState('');
  const [caution, setCaution] = useState('');
  const [estFood, setEstFood] = useState(false);
  const [dateExp, setDateExp] = useState('');
  const [photos, setPhotos] = useState<Array<{ uri: string; name: string; type: string }>>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    if (photos.length >= 3) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission refusée', 'Accès galerie requis');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPhotos((prev) => [
        ...prev,
        { uri: a.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' },
      ]);
    }
  };

  const requestCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation pour publier une annonce.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });
    } catch (error: any) {
      Alert.alert('Erreur GPS', error?.message ?? 'Impossible de récupérer votre position.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const submit = async () => {
    if (!titre.trim() || !desc.trim())
      return Alert.alert('Erreur', 'Titre et description sont obligatoires');
    if (!location)
      return Alert.alert('Erreur', 'Veuillez activer la localisation et récupérer votre position réelle.');
    if (photos.length !== 3)
      return Alert.alert('Erreur', `3 photos obligatoires (${photos.length}/3 sélectionnées)`);
    setLoading(true);
    try {
      await createAnnonce(
        token!,
        {
          titre: titre.trim(),
          description: desc.trim(),
          categorie: cat,
          mode,
          condition: cond,
          geolocalisation: [location.lat, location.lng],
          ...(prix ? { prixSymbolique: parseFloat(prix) } : {}),
          ...(caution ? { montantCaution: parseFloat(caution) } : {}),
          estFoodRescue: estFood,
          ...(dateExp ? { dateExpiration: dateExp } : {}),
        },
        photos,
      );
      setTitre('');
      setDesc('');
      setCat(CATS[0]);
      setMode(MODES[0]);
      setCond(CONDS[0]);
      setPrix('');
      setCaution('');
      setEstFood(false);
      setDateExp('');
      setPhotos([]);
      setLocation(null);
      Alert.alert('Succes', 'Votre annonce est en ligne.', [
        { text: 'Voir les annonces', onPress: () => navigate('Annonces') },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur annonce', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigate('Annonces')}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerT}>Nouvelle annonce</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={s.label}>Titre *</Text>
      <TextInput style={s.input} placeholder="Ex: Poussette Chicco" value={titre} onChangeText={setTitre} />

      <Text style={s.label}>Description *</Text>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Décrivez l'objet…" value={desc} onChangeText={setDesc} multiline />

      <Text style={s.label}>Catégorie</Text>
      <Chips items={CATS} value={cat} onChange={setCat} />

      <Text style={s.label}>Mode</Text>
      <Chips items={MODES} value={mode} onChange={setMode} />

      <Text style={s.label}>Condition</Text>
      <Chips items={CONDS} value={cond} onChange={setCond} />

      <Text style={s.label}>Prix</Text>
      <TextInput style={s.input} placeholder="Ex: 10€" value={prix} onChangeText={setPrix} keyboardType="numeric" />

      <Text style={s.label}>Caution</Text>
      <TextInput style={s.input} placeholder="Ex: 50€" value={caution} onChangeText={setCaution} keyboardType="numeric" />

      <Text style={s.label}>Food Rescue</Text>
      <TouchableOpacity style={[s.chip, estFood && s.chipOn]} onPress={() => setEstFood((prev) => !prev)}>
        <Text style={[s.chipT, estFood && s.chipTOn]}>
          {estFood ? 'Oui' : 'Non'}
        </Text>
      </TouchableOpacity>

      <Text style={s.label}>Date d'expiration</Text>
      <TextInput style={s.input} placeholder="JJ/MM/AAAA" value={dateExp} onChangeText={setDateExp} />

      <Text style={s.label}>Localisation réelle *</Text>
      <TouchableOpacity
        style={[s.locationBtn, loadingLocation && { opacity: 0.7 }]}
        onPress={requestCurrentLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator color="#16a34a" />
        ) : (
          <Text style={s.locationBtnText}>
            {location ? 'Mettre à jour ma position GPS' : 'Utiliser ma position GPS'}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={s.locationValue}>
        {location
          ? `Latitude: ${location.lat.toFixed(6)} | Longitude: ${location.lng.toFixed(6)}`
          : 'Aucune position GPS récupérée.'}
      </Text>

      <Text style={s.label}>Photos ({photos.length}/3 — 3 obligatoires)</Text>
      <View style={s.row}>
        {photos.map((p, i) => (
          <View key={i} style={s.thumbWrap}>
            <Image source={{ uri: p.uri }} style={s.thumb} />
            <TouchableOpacity style={s.removeBtn} onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}>
              <Text style={s.removeT}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 3 && (
          <TouchableOpacity style={s.addPhoto} onPress={pickPhoto}>
            <Text style={{ fontSize: 28, color: '#16a34a' }}>+</Text>
            <Text style={{ fontSize: 10, color: '#16a34a' }}>Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitT}>Publier l'annonce</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  inner: { paddingBottom: 40 },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 14 },
  headerT: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6, marginHorizontal: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 15, backgroundColor: '#fff', marginHorizontal: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e5e7eb' },
  chipOn: { backgroundColor: '#16a34a' },
  chipT: { color: '#374151', fontSize: 12 },
  chipTOn: { color: '#fff', fontWeight: 'bold' },
  thumbWrap: { position: 'relative' },
  thumb: { width: 82, height: 82, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeT: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  addPhoto: { width: 82, height: 82, borderRadius: 8, borderWidth: 2, borderColor: '#16a34a', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  locationBtn: { marginHorizontal: 16, borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#ecfdf5' },
  locationBtnText: { color: '#15803d', fontWeight: '600' },
  locationValue: { marginHorizontal: 16, marginTop: 8, color: '#4b5563', fontSize: 12 },
  submitBtn: { backgroundColor: '#16a34a', margin: 16, marginTop: 28, padding: 15, borderRadius: 10, alignItems: 'center' },
  submitT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
