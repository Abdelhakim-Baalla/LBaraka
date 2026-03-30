import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['Tous', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  POUSSETTE: 'happy-outline',
  BRICOLAGE: 'construct-outline',
  MEDICAL: 'medkit-outline',
  EVENEMENTIEL: 'sparkles-outline',
  NOURRITURE: 'restaurant-outline',
  AUTRE: 'cube-outline',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [user, setUser] = useState<any>(null);
  const [searchText, setSearchText] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedCategory])
  );

  const loadData = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
      ]);
      if (userData) setUser(JSON.parse(userData));
      if (!token) { router.replace('/(auth)/sign-in'); return; }

      const cat = selectedCategory === 'Tous' ? undefined : selectedCategory;
      const data = await ApiService.getAnnonces(token, cat);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Error loading annonces:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filteredAnnonces = annonces.filter((annonce) => {
    if (!searchText.trim()) {
      return true;
    }

    const query = searchText.toLowerCase();
    const titre = String(annonce.titre || '').toLowerCase();
    const description = String(annonce.description || '').toLowerCase();

    return titre.includes(query) || description.includes(query);
  });

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white/90 px-5 pb-3 border-b border-outline-variant/30" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Ionicons name="leaf" size={20} color="#1B4332" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-on-surface-variant font-semibold">Marrakesh</Text>
              <Text numberOfLines={1} className="text-base font-bold text-primary">
                Bonjour{user?.profil?.prenom ? `, ${user.profil.prenom}` : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-bold text-primary">{user?.profil?.lBarakaScore || 250} pts</Text>
            </View>
            <Pressable className="w-9 h-9 rounded-lg bg-surface-container items-center justify-center">
              <Ionicons name="notifications-outline" size={18} color="#495057" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Annonces List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#012d1d" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#012d1d" />}
          contentContainerStyle={{ gap: 14, paddingTop: 14, paddingBottom: 24 }}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1 bg-white border border-outline-variant rounded-xl px-3 py-2.5 flex-row items-center gap-2">
              <Ionicons name="search" size={18} color="#6c757d" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Rechercher des objets ou services"
                placeholderTextColor="#6c757d"
                className="flex-1 text-on-surface"
              />
            </View>
            <Pressable className="bg-primary h-11 px-4 rounded-xl items-center justify-center flex-row gap-2">
              <Ionicons name="map-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-xs">Carte</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg border flex-row items-center gap-2 ${isActive ? 'bg-primary border-primary' : 'bg-white border-outline-variant'}`}
                >
                  <Ionicons
                    name={cat === 'Tous' ? 'grid-outline' : CATEGORY_ICONS[cat]}
                    size={14}
                    color={isActive ? '#fff' : '#495057'}
                  />
                  <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-on-surface-variant'}`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="h-48 rounded-2xl overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70' }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-primary/55 p-4 justify-end">
              <Text className="text-white text-lg font-extrabold">Food Rescue Actifs</Text>
              <Text className="text-white/90 text-xs mt-1">Récupération locale, impact direct, zéro gaspillage.</Text>
            </View>
          </View>

          {filteredAnnonces.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="file-tray-outline" size={42} color="#6c757d" />
              <Text className="text-on-surface-variant text-center">Aucune annonce disponible</Text>
            </View>
          ) : (
            filteredAnnonces.map((annonce) => (
              <Pressable
                key={annonce.id}
                onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                className="bg-white rounded-2xl p-4 border border-outline-variant/70 active:opacity-85"
              >
                {annonce.photos?.[0] && (
                  <Image
                    source={{ uri: annonce.photos[0] }}
                    className="w-full h-44 rounded-xl mb-3"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-primary mb-1" numberOfLines={1}>
                      {annonce.titre}
                    </Text>
                    <Text className="text-sm text-on-surface-variant" numberOfLines={2}>
                      {annonce.description}
                    </Text>
                  </View>
                  <View className="ml-3 items-end">
                    <View className="bg-primary/10 rounded-lg px-2 py-1 mb-1">
                      <View className="flex-row items-center gap-1">
                        <Ionicons
                          name={CATEGORY_ICONS[annonce.categorie] || 'cube-outline'}
                          size={12}
                          color="#1B4332"
                        />
                        <Text className="text-xs font-semibold text-primary">{annonce.categorie}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-on-surface-variant">{annonce.mode?.replace('_', ' ')}</Text>
                  </View>
                </View>
                {annonce.montantCaution > 0 && (
                  <View className="flex-row items-center mt-2 pt-2 border-t border-outline-variant/10">
                    <Ionicons name="shield-checkmark-outline" size={14} color="#717973" />
                    <Text className="text-xs text-on-surface-variant ml-1">Caution: {annonce.montantCaution} MAD</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}

          <View className="bg-primary rounded-2xl p-4 flex-row items-center overflow-hidden">
            <View className="flex-1 pr-3">
              <Text className="text-white text-base font-extrabold">Impact LBaraka</Text>
              <Text className="text-white/80 text-xs mt-1">Ensemble, nous réduisons le gaspillage et aidons le voisinage.</Text>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=70' }}
              className="w-24 h-20 rounded-xl"
              resizeMode="cover"
            />
          </View>
        </ScrollView>
      )}

      <Pressable
        onPress={() => router.push('/(annonces)/create')}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-xl"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}
