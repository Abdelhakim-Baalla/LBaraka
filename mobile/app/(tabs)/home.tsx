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

const CATEGORY_TONES: Record<string, string> = {
  POUSSETTE: '#C7F9CC',
  BRICOLAGE: '#FFD6A5',
  MEDICAL: '#D7E3FC',
  EVENEMENTIEL: '#FDE2E4',
  NOURRITURE: '#FFE8D6',
  AUTRE: '#E5E5E5',
};

const HOME_COLLECTIONS = [
  {
    key: 'NOURRITURE',
    title: 'Food Rescue Express',
    subtitle: 'Repas à sauver rapidement',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=70',
  },
  {
    key: 'BRICOLAGE',
    title: 'Zone Bricolage',
    subtitle: 'Outils et matériel utiles',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=70',
  },
  {
    key: 'MEDICAL',
    title: 'Santé Solidaire',
    subtitle: 'Équipement à partager',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=70',
  },
];

const HOME_THEMES = [
  {
    key: 'NOURRITURE',
    title: 'Semaine Anti-Gaspi',
    subtitle: 'Repas et paniers à redistribuer rapidement',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70',
  },
  {
    key: 'POUSSETTE',
    title: 'Parents Solidaires',
    subtitle: 'Poussettes, habits et accessoires bébé',
    image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=70',
  },
  {
    key: 'AUTRE',
    title: 'Quartier en Action',
    subtitle: 'Petites aides utiles entre voisins',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=70',
  },
];

const HOME_FAQ = [
  {
    question: 'Comment reserver une annonce ?',
    answer: 'Ouvrez l\'annonce, cliquez sur "Reserver" puis confirmez. Le statut passe en reservation en attente.',
  },
  {
    question: 'Pourquoi une caution est demandee ?',
    answer: 'La caution securise l\'echange. Elle est rendue apres la transaction quand tout est valide.',
  },
  {
    question: 'Comment gagner plus de points LBaraka ?',
    answer: 'Publiez des annonces utiles, respectez les rendez-vous et finalisez vos transactions proprement.',
  },
  {
    question: 'Que faire si une photo ne saffiche pas ?',
    answer: 'Tirez pour rafraichir la page. Si besoin, modifiez l\'annonce et remplacez la photo depuis la galerie.',
  },
];

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
  const [showAllList, setShowAllList] = useState(false);
  const [openedFaqIndex, setOpenedFaqIndex] = useState<number | null>(null);

  const formatDate = (value?: string) => {
    if (!value) {
      return 'N/A';
    }

    return new Date(value).toLocaleDateString('fr-FR');
  };

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

  const featuredAnnonces = filteredAnnonces.slice(0, 8);
  const secondaryAnnonces = filteredAnnonces.slice(8, 16);
  const compactAnnonces = filteredAnnonces.slice(0, 12);
  const freeAnnoncesCount = filteredAnnonces.filter((item) => item.prixSymbolique === null || item.prixSymbolique === undefined).length;
  const foodRescueCount = filteredAnnonces.filter((item) => item.estFoodRescue).length;
  const categorySummary = CATEGORIES
    .filter((item) => item !== 'Tous')
    .map((cat) => ({
      category: cat,
      count: filteredAnnonces.filter((annonce) => annonce.categorie === cat).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const maxCategoryCount = Math.max(1, ...categorySummary.map((item) => item.count));
  const categoryMeters = categorySummary.map((item) => ({
    ...item,
    percent: Math.round((item.count / maxCategoryCount) * 100),
  }));

  const topContributors = filteredAnnonces
    .map((annonce) => annonce.createur?.profil)
    .filter((profil) => !!profil)
    .sort((a, b) => (b?.lBarakaScore || 0) - (a?.lBarakaScore || 0))
    .filter((profil, index, array) => {
      const key = `${profil?.prenom || ''}-${profil?.nom || ''}-${profil?.ville || ''}`;
      return array.findIndex((item) => `${item?.prenom || ''}-${item?.nom || ''}-${item?.ville || ''}` === key) === index;
    })
    .slice(0, 5);

  return (
    <View className="flex-1 bg-surface">
      {/* Header Simple */}
      <Animated.View entering={FadeInUp.duration(500)} className="bg-white/90 border-b border-outline-variant/30 px-5 pb-4" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
              <Ionicons name="leaf" size={22} color="#012d1d" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-on-surface-variant font-semibold">{userLocation}</Text>
              <Text className="text-base font-bold text-primary" numberOfLines={1}>
                Bonjour{user?.profil?.prenom ? `, ${user.profil.prenom}` : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 px-3 py-2 rounded-lg">
              <Text className="text-xs font-bold text-primary">{user?.profil?.lBarakaScore || 0} pts</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(annonces)/mine')}
              className="w-11 h-11 rounded-lg bg-surface-container items-center justify-center"
            >
              <Ionicons name="albums-outline" size={20} color="#414844" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Annonces List */}
      {isLoading ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-5 pt-4">
            <View className="h-12 rounded-xl bg-surface-container mb-3" />
            <View className="h-24 rounded-2xl bg-surface-container mb-3" />
            <View className="h-36 rounded-2xl bg-surface-container mb-3" />
            <View className="h-40 rounded-2xl bg-surface-container mb-3" />
            <View className="h-40 rounded-2xl bg-surface-container mb-3" />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#012d1d" />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Search & Filter Row */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} className="px-5 pt-4 pb-3 flex-row items-center gap-2.5">
            <View className="flex-1 bg-white border border-outline-variant rounded-xl px-3 py-3 flex-row items-center gap-2">
              <Ionicons name="search" size={18} color="#414844" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Rechercher..."
                placeholderTextColor="#a5a6aa"
                className="flex-1 text-sm text-on-surface"
              />
            </View>
            <Pressable className="bg-primary h-12 px-4 rounded-xl items-center justify-center">
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
                    className={`px-4 py-2.5 rounded-lg border flex-row items-center gap-2 ${
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

          <Animated.View entering={FadeInUp.delay(170).duration(600)} className="px-5 mt-1 mb-2">
            <View className="bg-white rounded-2xl border border-outline-variant p-3 mb-3">
              <Text className="text-sm font-extrabold text-primary">Tableau rapide</Text>
              <View className="flex-row mt-2 gap-2">
                <View className="flex-1 bg-primary/10 rounded-xl px-3 py-2">
                  <Text className="text-xs text-on-surface-variant">Annonces</Text>
                  <Text className="text-base font-bold text-primary">{filteredAnnonces.length}</Text>
                </View>
                <View className="flex-1 bg-emerald-100 rounded-xl px-3 py-2">
                  <Text className="text-xs text-on-surface-variant">Gratuites</Text>
                  <Text className="text-base font-bold text-emerald-700">{freeAnnoncesCount}</Text>
                </View>
                <View className="flex-1 bg-amber-100 rounded-xl px-3 py-2">
                  <Text className="text-xs text-on-surface-variant">Food Rescue</Text>
                  <Text className="text-base font-bold text-amber-700">{foodRescueCount}</Text>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-2xl border border-outline-variant p-3 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-extrabold text-primary">Barometre local</Text>
                <Text className="text-[11px] text-on-surface-variant">Categories actives</Text>
              </View>
              <View className="gap-2">
                {categoryMeters.map((item) => (
                  <Pressable key={`meter-${item.category}`} onPress={() => setSelectedCategory(item.category)}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-semibold text-on-surface-variant">{item.category}</Text>
                      <Text className="text-xs font-bold text-primary">{item.count}</Text>
                    </View>
                    <View className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <View className="h-2 rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(annonces)/create')}
              className="bg-white border border-outline-variant rounded-2xl p-3 overflow-hidden"
            >
              <SmartAnnonceImage
                uri="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=70"
                className="w-full h-34 rounded-xl overflow-hidden mb-2"
                resizeMode="cover"
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-extrabold text-primary">Publiez une annonce en 30 secondes</Text>
                  <Text className="text-xs text-on-surface-variant mt-1">Ajoutez photos, géolocalisation et conditions en quelques clics.</Text>
                </View>
                <View className="bg-primary rounded-xl px-3 py-2.5">
                  <Text className="text-white text-xs font-bold">Publier</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(185).duration(600)} className="px-5 mb-2">
            <View className="flex-row gap-2 mb-3">
              <Pressable
                onPress={() => router.push('/(annonces)/create')}
                className="flex-1 bg-primary rounded-xl py-3 px-3 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text className="text-white text-xs font-bold">Créer annonce</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/map')}
                className="flex-1 bg-white border border-outline-variant rounded-xl py-3 px-3 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="map-outline" size={16} color="#1B4332" />
                <Text className="text-primary text-xs font-bold">Explorer carte</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-extrabold text-primary">Collections du moment</Text>
              <Text className="text-xs text-on-surface-variant">Tapez pour filtrer</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {HOME_COLLECTIONS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedCategory(item.key)}
                  className="bg-white border border-outline-variant rounded-2xl p-2 w-56"
                >
                  <SmartAnnonceImage uri={item.image} className="w-full h-28 rounded-xl overflow-hidden mb-2" resizeMode="cover" />
                  <Text className="text-sm font-bold text-primary" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={1}>{item.subtitle}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(205).duration(600)} className="px-5 mb-2">
            <Text className="text-base font-extrabold text-primary mb-2">Catégories tendances</Text>
            <View className="flex-row flex-wrap gap-2">
              {categorySummary.map((item) => (
                <Pressable
                  key={`trend-${item.category}`}
                  onPress={() => setSelectedCategory(item.category)}
                  className="bg-white border border-outline-variant rounded-xl px-3 py-2 flex-row items-center gap-2"
                >
                  <Ionicons name={CATEGORY_ICONS[item.category] || 'cube-outline'} size={14} color="#1B4332" />
                  <Text className="text-sm text-on-surface-variant font-semibold">{item.category}</Text>
                  <View className="bg-primary/10 rounded-md px-2 py-0.5">
                      <Text className="text-xs font-bold text-primary">{item.count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Annonces */}
          {filteredAnnonces.length === 0 ? (
            <View className="items-center justify-center py-20 px-5">
              <Ionicons name="albums-outline" size={42} color="#a5a6aa" />
              <Text className="text-on-surface-variant text-center mt-3">Aucune annonce</Text>
            </View>
          ) : (
            <View>
              <Animated.View entering={FadeInUp.delay(240).duration(600)} className="px-5 mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-extrabold text-primary">A la une</Text>
                  <Pressable onPress={() => setShowAllList((prev) => !prev)} className="bg-primary/10 rounded-lg px-3 py-1">
                    <Text className="text-sm font-bold text-primary">{showAllList ? 'Masquer tout' : 'Voir toutes les annonces'}</Text>
                  </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                  {featuredAnnonces.map((annonce) => (
                    <Pressable
                      key={`featured-${annonce.id}`}
                      onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                      className="bg-white border border-outline-variant rounded-2xl p-3 w-64"
                    >
                      <View className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: CATEGORY_TONES[annonce.categorie] || '#E5E5E5' }} />
                      <SmartAnnonceImage uri={annonce.photos?.[0]} className="w-full h-30 rounded-xl overflow-hidden mb-2" resizeMode="cover" />
                      <Text className="text-base font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
                      <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>{annonce.description}</Text>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-xs text-on-surface-variant">{annonce.categorie}</Text>
                        <Text className="text-xs text-on-surface-variant">{annonce.nombreVues || 0} vues</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(260).duration(600)} className="px-5 mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-extrabold text-primary">Encore pour vous</Text>
                  <Text className="text-xs text-on-surface-variant">Sélection continue</Text>
                </View>
                {secondaryAnnonces.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {secondaryAnnonces.map((annonce) => (
                      <Pressable
                        key={`secondary-${annonce.id}`}
                        onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                        className="bg-white border border-outline-variant rounded-2xl p-2 w-52"
                      >
                        <SmartAnnonceImage uri={annonce.photos?.[0]} className="w-full h-30 rounded-xl overflow-hidden mb-2" resizeMode="cover" />
                        <Text className="text-sm font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
                        <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={1}>{annonce.categorie}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View className="bg-white border border-outline-variant rounded-xl p-3">
                    <Text className="text-xs text-on-surface-variant">Ajoutez plus d'annonces pour enrichir cette section.</Text>
                  </View>
                )}
              </Animated.View>

              {showAllList ? (
                <Animated.View entering={FadeInUp.delay(280).duration(600)} className="px-5 mt-4">
                  <Text className="text-base font-extrabold text-primary mb-2">Toutes les annonces</Text>
                  <View className="flex-row flex-wrap justify-between">
                    {compactAnnonces.map((annonce) => (
                      <Pressable
                        key={`grid-${annonce.id}`}
                        onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                        className="bg-white border border-outline-variant rounded-2xl p-2 mb-3"
                        style={{ width: '48.5%' }}
                      >
                        <SmartAnnonceImage uri={annonce.photos?.[0]} className="w-full h-26 rounded-xl overflow-hidden mb-2" resizeMode="cover" />
                        <Text className="text-sm font-bold text-primary" numberOfLines={1}>{annonce.titre}</Text>
                        <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={1}>{annonce.categorie}</Text>
                        <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{formatDate(annonce.dateCreation)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              ) : null}

              <Animated.View entering={FadeInUp.delay(320).duration(600)} className="px-5 mt-4">
                <Text className="text-base font-extrabold text-primary mb-2">Inspiration & Bons plans</Text>
                <View className="bg-white rounded-2xl border border-outline-variant p-4 mb-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="bulb-outline" size={16} color="#1B4332" />
                    <Text className="text-base font-bold text-primary">Astuce du jour</Text>
                  </View>
                  <Text className="text-sm text-on-surface-variant">Ajoutez des photos bien éclairées et une caution juste pour recevoir plus de réservations.</Text>
                </View>
                <View className="bg-emerald-50 rounded-2xl border border-outline-variant p-4">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="megaphone-outline" size={16} color="#1B4332" />
                    <Text className="text-base font-bold text-primary">Espace annonce locale</Text>
                  </View>
                  <Text className="text-sm text-on-surface-variant">Bientôt: section sponsorisée pour associations de quartier et partenaires solidaires.</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(360).duration(600)} className="px-5 mt-4">
                <Text className="text-base font-extrabold text-primary mb-2">Partenaires du quartier</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  <View className="bg-white border border-outline-variant rounded-2xl p-2 w-52">
                    <SmartAnnonceImage
                      uri="https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=70"
                      className="w-full h-22 rounded-xl overflow-hidden mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-sm font-bold text-primary">Association Nourrir Ensemble</Text>
                    <Text className="text-xs text-on-surface-variant mt-1">Collectes chaque vendredi.</Text>
                  </View>
                  <View className="bg-white border border-outline-variant rounded-2xl p-2 w-52">
                    <SmartAnnonceImage
                      uri="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=70"
                      className="w-full h-22 rounded-xl overflow-hidden mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-sm font-bold text-primary">Réseau Voisins Solidaires</Text>
                    <Text className="text-xs text-on-surface-variant mt-1">Prêt et entraide locale.</Text>
                  </View>
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(380).duration(600)} className="px-5 mt-4">
                <Text className="text-base font-extrabold text-primary mb-2">Top contributeurs</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {topContributors.length > 0 ? (
                    topContributors.map((profil, index) => (
                      <View key={`contrib-${index}`} className="bg-white border border-outline-variant rounded-2xl p-3 w-52">
                        <View className="flex-row items-center gap-2 mb-2">
                          <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                            <Ionicons name="person-outline" size={16} color="#1B4332" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                              {profil?.prenom || 'Membre'} {profil?.nom || ''}
                            </Text>
                            <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{profil?.ville || 'N/A'}</Text>
                          </View>
                        </View>
                        <Text className="text-xs text-on-surface-variant">Palier: {profil?.palier || 'N/A'}</Text>
                        <Text className="text-sm font-bold text-primary mt-1">{profil?.lBarakaScore ?? 0} pts</Text>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white border border-outline-variant rounded-2xl p-3 w-72">
                      <Text className="text-sm text-on-surface-variant">Les contributeurs apparaîtront ici après plus d'activité.</Text>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(390).duration(600)} className="px-5 mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-extrabold text-primary">Themes solidaires</Text>
                  <Text className="text-xs text-on-surface-variant">Nouveaux focus</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {HOME_THEMES.map((theme) => (
                    <Pressable
                      key={`theme-${theme.title}`}
                      onPress={() => setSelectedCategory(theme.key)}
                      className="bg-white border border-outline-variant rounded-2xl p-2 w-64"
                    >
                      <SmartAnnonceImage uri={theme.image} className="w-full h-24 rounded-xl overflow-hidden mb-2" resizeMode="cover" />
                      <Text className="text-sm font-bold text-primary" numberOfLines={1}>{theme.title}</Text>
                      <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={2}>{theme.subtitle}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(395).duration(600)} className="px-5 mt-4">
                <Text className="text-base font-extrabold text-primary mb-2">FAQ rapide</Text>
                <View className="gap-2">
                  {HOME_FAQ.map((item, index) => {
                    const isOpen = openedFaqIndex === index;

                    return (
                      <Pressable
                        key={`faq-${item.question}`}
                        onPress={() => {
                          if (isOpen) {
                            setOpenedFaqIndex(null);
                          } else {
                            setOpenedFaqIndex(index);
                          }
                        }}
                        className="bg-white border border-outline-variant rounded-xl px-3 py-3"
                      >
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="text-xs font-bold text-primary flex-1">{item.question}</Text>
                          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#1B4332" />
                        </View>
                        {isOpen ? (
                          <Text className="text-xs text-on-surface-variant mt-2">{item.answer}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(400).duration(600)} className="px-5 mt-4">
                <View className="bg-primary rounded-2xl p-4">
                  <Text className="text-white text-base font-extrabold">Une idée à partager ?</Text>
                  <Text className="text-white/90 text-xs mt-1">Transformez vos objets inutilisés en entraide utile pour votre communauté.</Text>
                  <Pressable
                    onPress={() => router.push('/(annonces)/create')}
                    className="self-start bg-white rounded-lg px-3 py-2.5 mt-3"
                  >
                    <Text className="text-primary text-xs font-bold">Créer une annonce</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(annonces)/create')}
        className="absolute bottom-20 right-5 w-15 h-15 rounded-2xl bg-primary items-center justify-center shadow-xl"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
