import { useCallback, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';

export default function AnnonceDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();

  const [annonce, setAnnonce] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const loadAnnonce = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userRaw = await AsyncStorage.getItem('user');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAnnonceById(token, String(params.id || ''));
      setAnnonce(data.annonce);

      const user = userRaw ? JSON.parse(userRaw) : null;
      setIsOwner(data.annonce?.createurId === user?.id);
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

  const reserveAnnonce = async () => {
    try {
      setIsReserving(true);
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      await ApiService.reserveAnnonce(token, String(params.id || ''));
      Alert.alert('Succès', 'Annonce réservée. Vérifiez l\'onglet Transactions.', [
        { text: 'Voir transactions', onPress: () => router.push('/(tabs)/transactions') },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de réserver cette annonce.');
    } finally {
      setIsReserving(false);
    }
  };

  const deleteAnnonce = async () => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const token = await AsyncStorage.getItem('accessToken');

            if (!token) {
              router.replace('/(auth)/sign-in');
              return;
            }

            await ApiService.deleteAnnonce(token, String(params.id || ''));
            Alert.alert('Succès', 'Annonce supprimée.');
            router.replace('/(annonces)/mine');
          } catch (error: any) {
            Alert.alert('Erreur', error?.message || 'Impossible de supprimer cette annonce.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  if (!annonce) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-on-surface-variant">Annonce introuvable.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/home')} className="mt-4 bg-primary px-4 py-3 rounded-xl">
          <Text className="text-white font-bold">Retour accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 10 }}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }} className="mb-3">
          {(annonce.photos?.length ? annonce.photos : ['']).map((photo: string, index: number) => (
            <SmartAnnonceImage
              key={`${annonce.id}-${index}`}
              uri={photo}
              className="w-80 h-56 rounded-2xl overflow-hidden"
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
          <Text className="text-lg font-extrabold text-primary">{annonce.titre}</Text>
          <Text className="text-sm text-on-surface-variant mt-2">{annonce.description}</Text>

          <View className="flex-row flex-wrap gap-2 mt-3">
            <View className="bg-primary/10 rounded-lg px-2 py-1">
              <Text className="text-xs font-semibold text-primary">{annonce.categorie}</Text>
            </View>
            <View className="bg-surface-container rounded-lg px-2 py-1">
              <Text className="text-xs text-on-surface-variant">{annonce.mode}</Text>
            </View>
            <View className="bg-surface-container rounded-lg px-2 py-1">
              <Text className="text-xs text-on-surface-variant">{annonce.condition}</Text>
            </View>
          </View>

          {annonce.prixSymbolique !== null && annonce.prixSymbolique !== undefined ? (
            <Text className="text-sm font-semibold text-on-surface mt-3">Prix: {String(annonce.prixSymbolique)} MAD</Text>
          ) : null}

          {annonce.montantCaution !== null && annonce.montantCaution !== undefined ? (
            <Text className="text-sm font-semibold text-on-surface mt-1">Caution: {String(annonce.montantCaution)} MAD</Text>
          ) : null}

          <View className="mt-3 pt-3 border-t border-outline-variant/20 gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="person-outline" size={14} color="#717973" />
              <Text className="text-xs text-on-surface-variant">
                Publié par: {annonce.createur?.profil?.prenom || ''} {annonce.createur?.profil?.nom || ''}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Ionicons name="location-outline" size={14} color="#717973" />
              <Text className="text-xs text-on-surface-variant">
                Position: {annonce.geolocalisation?.[0] ? `${annonce.geolocalisation[0]}, ${annonce.geolocalisation[1]}` : 'Non disponible'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={14} color="#717973" />
              <Text className="text-xs text-on-surface-variant">
                Publié le: {annonce.dateCreation ? new Date(annonce.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Ionicons name="eye-outline" size={14} color="#717973" />
              <Text className="text-xs text-on-surface-variant">Vues: {annonce.nombreVues || 0}</Text>
            </View>
          </View>
        </View>

        {!isOwner ? (
          <Pressable
            onPress={reserveAnnonce}
            disabled={isReserving}
            className={`rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3 ${isReserving ? 'bg-primary/60' : 'bg-primary'}`}
          >
            {isReserving ? <ActivityIndicator color="#fff" /> : <Ionicons name="bag-check-outline" size={18} color="#fff" />}
            <Text className="text-white font-bold">{isReserving ? 'Réservation...' : 'Réserver cette annonce'}</Text>
          </Pressable>
        ) : (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
            <Text className="text-amber-800 text-xs">Cette annonce vous appartient. Vous pouvez la supprimer depuis cet écran.</Text>
          </View>
        )}

        {isOwner ? (
          <Pressable
            onPress={deleteAnnonce}
            disabled={isDeleting}
            className={`rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3 ${isDeleting ? 'bg-error/60' : 'bg-error'}`}
          >
            {isDeleting ? <ActivityIndicator color="#fff" /> : <Ionicons name="trash-outline" size={18} color="#fff" />}
            <Text className="text-white font-bold">{isDeleting ? 'Suppression...' : 'Supprimer l\'annonce'}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/(tabs)/transactions')}
          className="bg-white border border-outline-variant rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3"
        >
          <Ionicons name="swap-horizontal-outline" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Voir les transactions</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/home')}
          className="bg-white border border-outline-variant rounded-xl py-4 items-center justify-center flex-row gap-2"
        >
          <Ionicons name="home-outline" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Retour accueil</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
