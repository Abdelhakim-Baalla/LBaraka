import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius, shadowMd, shadowSm } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { T } from '../../components/ui/T';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { Avatar, EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

const CATEGORIES = ['Tous', 'POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'];

const CATEGORY_TILE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Tous: 'grid-outline',
  POUSSETTE: 'happy-outline',
  BRICOLAGE: 'hammer-outline',
  MEDICAL: 'medkit-outline',
  EVENEMENTIEL: 'calendar-outline',
  NOURRITURE: 'fast-food-outline',
  AUTRE: 'cube-outline',
};

const HOME_FAQ = [
  {
    question: 'Comment réserver une annonce ?',
      answer: 'Ouvrez l\'annonce, cliquez sur "Réserver" puis confirmez. Le statut passe en réservation en attente.',
  },
  {
    question: 'Pourquoi une caution est demandée ?',
    answer: 'La caution sécurise l\'échange. Elle est rendue après la transaction quand tout est valide.',
  },
  {
    question: 'Comment gagner plus de points LBaraka ?',
    answer: 'Publiez des annonces utiles, respectez les rendez-vous et finalisez vos transactions proprement.',
  },
  {
    question: 'Que faire si une photo ne s’affiche pas ?',
      answer: 'Tirez pour rafraîchir la page. Si besoin, modifiez l\'annonce et remplacez la photo depuis la galerie.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [user, setUser] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [userLocation, setUserLocation] = useState<string>('Ma localité');
  const [showAllList, setShowAllList] = useState(false);
  const [openedFaqIndex, setOpenedFaqIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const formatDate = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('fr-FR');
  };
  void formatDate;

  useFocusEffect(
    useCallback(() => {
      loadData();
      checkAdminRole();
    }, [selectedCategory])
  );

  const checkAdminRole = async () => {
    try {
      const userRaw = await AsyncStorage.getItem('user');
      if (userRaw) {
        const parsedUser = JSON.parse(userRaw);
        setIsAdmin(parsedUser?.role === 'ADMINISTRATEUR');
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const loadData = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
      ]);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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
    if (annonce.statut && annonce.statut !== 'DISPONIBLE') {
      return false;
    }
    if (!searchText.trim()) {
      return true;
    }
    const query = searchText.toLowerCase();
    const titre = String(annonce.titre || '').toLowerCase();
    const description = String(annonce.description || '').toLowerCase();
    return titre.includes(query) || description.includes(query);
  });

  const feature = filteredAnnonces[0];
  const nearbyAnnonces = (showAllList ? filteredAnnonces : filteredAnnonces.filter((a) => a.id !== feature?.id).slice(0, 5));
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

  const displayName =
    `${user?.profil?.prenom || ''} ${user?.profil?.nom || ''}`.trim() || 'Membre';
  const score = Number(user?.profil?.lBarakaScore || 0);

  const cautionLabel = (annonce: any) =>
    annonce.montantCaution !== null && annonce.montantCaution !== undefined
      ? `${String(annonce.montantCaution)} MAD`
      : 'Sans caution';

  const annonceVille = (annonce: any) =>
    String(annonce.ville || annonce.createur?.profil?.ville || userLocation || 'N/A');

  if (isLoading) {
    return (
      <Screen padBottom={108}>
        <View style={{ gap: 12, paddingTop: 12 }}>
          <View style={{ height: 58, borderRadius: radius.md, backgroundColor: c.surface2 }} />
          <View style={{ height: 120, borderRadius: radius.lg, backgroundColor: c.surface2 }} />
          <View style={{ height: 150, borderRadius: radius.lg, backgroundColor: c.surface2 }} />
          <View style={{ height: 170, borderRadius: radius.lg, backgroundColor: c.surface2 }} />
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={108} pad={0}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar name={displayName} size={40} />
            <View style={{ flex: 1 }}>
              <T kind="overline" color={c.muted} numberOfLines={1}>
                {userLocation}
              </T>
              <T kind="h3" numberOfLines={1} style={{ marginTop: 1 }}>
                Bonjour{user?.profil?.prenom ? `, ${user.profil.prenom}` : ''}
              </T>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: c.goldSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                height: 32,
              }}
            >
              <Ionicons name="star" size={13} color={c.gold} />
              <T kind="caption" color={c.onGoldSoft}>
                {`${score} pts`}
              </T>
            </View>
            <PressableScale
              onPress={() => router.push('/(tabs)/wallet')}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="wallet-outline" size={19} color={c.ink2} />
            </PressableScale>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          contentContainerStyle={{ paddingBottom: 110, gap: 20 }}
        >
          <Enter index={0}>
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: c.line,
                  paddingHorizontal: 14,
                  height: 52,
                  gap: 10,
                  ...shadowSm(mode),
                }}
              >
                <Ionicons name="search" size={18} color={c.muted} />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Rechercher..."
                  placeholderTextColor={c.muted}
                  style={{
                    flex: 1,
                    fontFamily: fontFamily.regular,
                    fontSize: 15,
                    color: c.ink,
                    height: '100%',
                  }}
                />
                {searchText.length > 0 ? (
                  <PressableScale onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={18} color={c.muted} />
                  </PressableScale>
                ) : null}
              </View>
              <PressableScale
                onPress={() => setShowAllList((prev) => !prev)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadowSm(mode),
                }}
              >
                <Ionicons name="options-outline" size={20} color={c.onPrimary} />
              </PressableScale>
            </View>
          </Enter>

          <Enter index={1}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
            >
              {CATEGORIES.map((cat) => {
                const selected = selectedCategory === cat;
                return (
                  <PressableScale
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      width: 78,
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderRadius: radius.lg,
                      backgroundColor: selected ? c.primary : c.surface,
                      borderWidth: selected ? 0 : 1,
                      borderColor: c.line,
                      alignItems: 'center',
                      gap: 6,
                      ...(selected ? shadowSm(mode) : {}),
                    }}
                  >
                    <Ionicons
                      name={CATEGORY_TILE_ICONS[cat]}
                      size={22}
                      color={selected ? c.onPrimary : c.primary}
                    />
                    <T
                      kind="caption"
                      center
                      color={selected ? c.onPrimary : c.muted}
                      numberOfLines={1}
                      style={{ fontSize: 9 }}
                    >
                      {cat}
                    </T>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Enter>

          {filteredAnnonces.length === 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              <Card>
                <EmptyState
                  icon="albums-outline"
                  title="Aucune annonce"
                  body="Essayez une autre recherche ou une autre catégorie."
                />
              </Card>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              <Enter index={2}>
                {feature ? (
                  <PressableScale onPress={() => router.push(`/(annonces)/${feature.id}`)}>
                    <View style={{ height: 300, backgroundColor: c.surface2 }}>
                      <SmartAnnonceImage uri={feature.photos?.[0]} className="w-full h-full" resizeMode="cover" />
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          paddingHorizontal: 16,
                          paddingTop: 44,
                          paddingBottom: 14,
                          backgroundColor: c.overlay,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Tag label={String(feature.categorie || 'À la une')} tone="gold" />
                          <T kind="caption" color="rgba(255,255,255,0.85)">
                            {`${feature.createur?.profil?.lBarakaScore ?? 0} pts de confiance`}
                          </T>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                          <T kind="h1" color="#fff" numberOfLines={2} style={{ flex: 1 }}>
                            {feature.titre}
                          </T>
                          <View
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 23,
                              backgroundColor: c.surface,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="arrow-forward" size={20} color={c.ink} />
                          </View>
                        </View>
                        <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                          <Tag label={cautionLabel(feature)} tone="gold" />
                        </View>
                      </View>
                    </View>
                  </PressableScale>
                ) : null}
              </Enter>

              <Enter index={3}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <T kind="small" color={c.muted}>
                    {`${filteredAnnonces.length} annonces · ${freeAnnoncesCount} gratuites · ${foodRescueCount} food`}
                  </T>
                  <PressableScale onPress={() => setShowAllList((prev) => !prev)} style={{ padding: 6 }}>
                    <T kind="bodyStrong" color={c.primary}>
                      {showAllList ? 'Réduire' : 'Tout voir'}
                    </T>
                  </PressableScale>
                </View>
              </Enter>

              <Enter index={4}>
                <View style={{ paddingHorizontal: 16 }}>
                  <SectionHeader title="Près de chez vous" action="Carte" onAction={() => router.push('/(tabs)/map')} />
                  <View style={{ gap: 10, marginTop: 12 }}>
                    {nearbyAnnonces.map((annonce) => (
                      <PressableScale key={`nearby-${annonce.id}`} onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            backgroundColor: c.surface,
                            borderRadius: radius.lg,
                            padding: 10,
                            ...shadowSm(mode),
                          }}
                        >
                          <View style={{ width: 68, height: 68, borderRadius: radius.md, overflow: 'hidden', backgroundColor: c.surface2 }}>
                            <SmartAnnonceImage uri={annonce.photos?.[0]} className="w-full h-full" resizeMode="cover" />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <T kind="bodyStrong" numberOfLines={1}>
                              {annonce.titre}
                            </T>
                            <T kind="small" color={c.muted} numberOfLines={1}>
                              {annonceVille(annonce)}
                            </T>
                            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                              <Tag label={cautionLabel(annonce)} tone="gold" />
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={c.muted} />
                        </View>
                      </PressableScale>
                    ))}
                  </View>
                </View>
              </Enter>

              <Enter index={5}>
                <View style={{ paddingHorizontal: 16 }}>
                  <Card>
                    <SectionHeader title="Baromètre local" action="Catégories actives" />
                    <View style={{ gap: 10, marginTop: 12 }}>
                      {categoryMeters.map((item) => (
                        <PressableScale key={`meter-${item.category}`} onPress={() => setSelectedCategory(item.category)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <T kind="small">{item.category}</T>
                            <T kind="bodyStrong" color={c.primary}>
                              {item.count}
                            </T>
                          </View>
                          <View style={{ width: '100%', height: 6, borderRadius: radius.pill, backgroundColor: c.surface2, overflow: 'hidden' }}>
                            <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.primary, width: `${item.percent}%` }} />
                          </View>
                        </PressableScale>
                      ))}
                    </View>
                  </Card>
                </View>
              </Enter>

              <Enter index={6}>
                <View style={{ paddingHorizontal: 16 }}>
                  <SectionHeader title="FAQ rapide" />
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {HOME_FAQ.map((item, index) => {
                      const isOpen = openedFaqIndex === index;
                      return (
                        <Card key={`faq-${item.question}`} pad={14}>
                          <PressableScale
                            onPress={() => {
                              if (isOpen) {
                                setOpenedFaqIndex(null);
                              } else {
                                setOpenedFaqIndex(index);
                              }
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <T kind="bodyStrong" style={{ flex: 1 }}>
                                {item.question}
                              </T>
                              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={c.primary} />
                            </View>
                            {isOpen ? (
                              <T kind="small" color={c.muted} style={{ marginTop: 8 }}>
                                {item.answer}
                              </T>
                            ) : null}
                          </PressableScale>
                        </Card>
                      );
                    })}
                  </View>
                </View>
              </Enter>
            </View>
          )}
        </ScrollView>

        <PressableScale
          onPress={() => router.push('/(annonces)/create')}
          style={{
            position: 'absolute',
            bottom: 104,
            right: 16,
            width: 54,
            height: 54,
            borderRadius: 15,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadowMd(mode),
          }}
        >
          <Ionicons name="add" size={25} color={c.onPrimary} />
        </PressableScale>

        {isAdmin && (
          <View style={{ position: 'absolute', bottom: 172, right: 20 }}>
            <PressableScale
              onPress={() => router.push('/(admin)/dashboard')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
                borderRadius: radius.pill,
                paddingHorizontal: 16,
                height: 44,
                ...shadowSm(mode),
              }}
            >
              <Ionicons name="shield-checkmark" size={18} color={c.primary} />
              <T kind="bodyStrong" color={c.primary}>
                Admin
              </T>
            </PressableScale>
          </View>
        )}
      </View>
    </Screen>
  );
}
