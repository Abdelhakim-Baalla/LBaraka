import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SmartAnnonceImage from '../../components/smart-annonce-image';

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
  const [userLocation, setUserLocation] = useState<string>('Ma localité');

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
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Charger location depuis user profile
        if (parsedUser.profil?.ville) {
          setUserLocation(parsedUser.profil.ville);
        }
      }
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
      {/* Header Simple */}
      <Animated.View entering={FadeInUp.duration(500)} className="bg-white/90 border-b border-outline-variant/30 px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Ionicons name="leaf" size={20} color="#012d1d" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-on-surface-variant font-semibold">{userLocation}</Text>
              <Text className="text-base font-bold text-primary" numberOfLines={1}>
                Bonjour{user?.profil?.prenom ? `, ${user.profil.prenom}` : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 px-3 py-1 rounded-lg">
              <Text className="text-xs font-bold text-primary">{user?.profil?.lBarakaScore || 0} pts</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(annonces)/mine')}
              className="w-9 h-9 rounded-lg bg-surface-container items-center justify-center"
            >
              <Ionicons name="albums-outline" size={18} color="#414844" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Annonces List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#012d1d" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#012d1d" />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Search & Filter Row */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} className="px-5 pt-4 pb-2 flex-row items-center gap-2.5">
            <View className="flex-1 bg-white border border-outline-variant rounded-xl px-3 py-2.5 flex-row items-center gap-2">
              <Ionicons name="search" size={18} color="#414844" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Rechercher..."
                placeholderTextColor="#a5a6aa"
                className="flex-1 text-on-surface"
              />
            </View>
            <Pressable className="bg-primary h-11 px-4 rounded-xl items-center justify-center">
              <Ionicons name="settings" size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Categories */}
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="px-5 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg border flex-row items-center gap-2 ${
                      isActive ? 'bg-primary border-primary' : 'bg-white border-outline-variant'
                    }`}
                  >
                    <Ionicons
                      name={cat === 'Tous' ? 'grid-outline' : CATEGORY_ICONS[cat]}
                      size={14}
                      color={isActive ? '#fff' : '#414844'}
                    />
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-on-surface-variant'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Annonces */}
          {filteredAnnonces.length === 0 ? (
            <View className="items-center justify-center py-20 px-5">
              <Ionicons name="albums-outline" size={42} color="#a5a6aa" />
              <Text className="text-on-surface-variant text-center mt-3">Aucune annonce</Text>
            </View>
          ) : (
            filteredAnnonces.map((annonce, idx) => (
              <Animated.View key={annonce.id} entering={FadeInUp.delay(200 + idx * 50).duration(600)} className="px-5">
                <Pressable
                  onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                  className="bg-white rounded-2xl p-4 border border-outline-variant/70 active:opacity-85 mb-3"
                >
                  <SmartAnnonceImage
                    uri={annonce.photos?.[0]}
                    className="w-full h-44 rounded-xl mb-3 overflow-hidden"
                    resizeMode="cover"
                  />

                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-primary mb-1" numberOfLines={1}>
                        {annonce.titre}
                      </Text>
                      <Text className="text-sm text-on-surface-variant mb-2" numberOfLines={2}>
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
                      <Text className="text-xs text-on-surface-variant">{String(annonce.mode || '').replaceAll('_', ' ')}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mt-3">
                    <View className="bg-surface-container rounded-lg px-2 py-1">
                      <Text className="text-[11px] text-on-surface-variant">Etat: {annonce.condition || 'N/A'}</Text>
                    </View>
                    <View className="bg-surface-container rounded-lg px-2 py-1">
                      <Text className="text-[11px] text-on-surface-variant">
                        Caution: {annonce.montantCaution !== null && annonce.montantCaution !== undefined ? `${annonce.montantCaution} MAD` : 'Aucune'}
                      </Text>
                    </View>
                    <View className="bg-surface-container rounded-lg px-2 py-1">
                      <Text className="text-[11px] text-on-surface-variant">
                        Prix: {annonce.prixSymbolique !== null && annonce.prixSymbolique !== undefined ? `${annonce.prixSymbolique} MAD` : 'Gratuit'}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 pt-3 border-t border-outline-variant/30 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="eye-outline" size={14} color="#717973" />
                      <Text className="text-xs text-on-surface-variant">{annonce.nombreVues || 0} vues</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="chevron-forward-circle-outline" size={16} color="#1B4332" />
                      <Text className="text-xs font-bold text-primary">Voir détail</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(annonces)/create')}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-xl"
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}
