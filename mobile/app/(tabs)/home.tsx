import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';

const CATEGORIES = ['Tous', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];

const CATEGORY_ICONS: Record<string, string> = {
  POUSSETTE: '🍼', BRICOLAGE: '🔧', MEDICAL: '🏥',
  EVENEMENTIEL: '🎉', NOURRITURE: '🍽️', AUTRE: '📦',
};

export default function HomeScreen() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [user, setUser] = useState<any>(null);

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

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white/70 backdrop-blur-xl shadow-lg px-6 h-16 flex-row items-center justify-between">
        <Text className="text-xl font-bold tracking-widest text-primary">LBARAKA</Text>
        <Pressable
          onPress={() => router.push('/(annonces)/create')}
          className="w-10 h-10 rounded-xl bg-primary-container items-center justify-center"
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* Welcome */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-primary">
          Bonjour{user?.profil?.prenom ? `, ${user.profil.prenom}` : ''} 👋
        </Text>
        <Text className="text-sm text-on-surface-variant mt-1">Découvrez les annonces disponibles</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4" contentContainerStyle={{ gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl ${selectedCategory === cat ? 'bg-primary-container' : 'bg-white'}`}
          >
            <Text className={`text-sm font-semibold ${selectedCategory === cat ? 'text-white' : 'text-on-surface'}`}>
              {cat === 'Tous' ? '🌿 Tous' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Annonces List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#012d1d" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#012d1d" />}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        >
          {annonces.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-4">📭</Text>
              <Text className="text-on-surface-variant text-center">Aucune annonce disponible</Text>
            </View>
          ) : (
            annonces.map((annonce) => (
              <Pressable
                key={annonce.id}
                onPress={() => router.push(`/(annonces)/${annonce.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm active:opacity-80"
              >
                {annonce.photos?.[0] && (
                  <Image
                    source={{ uri: annonce.photos[0] }}
                    className="w-full h-40 rounded-lg mb-3"
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
                      <Text className="text-xs font-semibold text-primary">
                        {CATEGORY_ICONS[annonce.categorie]} {annonce.categorie}
                      </Text>
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
        </ScrollView>
      )}
    </View>
  );
}
