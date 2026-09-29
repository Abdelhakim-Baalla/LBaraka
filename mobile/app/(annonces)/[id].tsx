import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';
import { useTheme } from '../../theme/ThemeContext';
import { radius, shadowMd, shadowSm } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { Avatar, EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

function statutTone(statut?: string): 'success' | 'gold' | 'info' | 'muted' {
  if (statut === 'DISPONIBLE') return 'success';
  if (statut === 'RESERVEE' || statut === 'EN_ATTENTE') return 'gold';
  if (statut === 'EMPRUNTEE' || statut === 'EN_COURS') return 'info';
  return 'muted';
}

export default function AnnonceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<FlatList<string>>(null);

  const [annonce, setAnnonce] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const formatDate = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleString('fr-FR');
  };

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
      setReservationError('');
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      await ApiService.reserveAnnonce(token, String(params.id || ''));
      Alert.alert('Succès', 'Annonce réservée avec succès.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/transactions') },
      ]);
    } catch (error: any) {
      const rawMessage = String(error?.message || 'Impossible de réserver cette annonce.');

      if (rawMessage.toLowerCase().includes('solde insuffisant')) {
        setReservationError('Solde insuffisant pour réserver cette annonce. Veuillez faire un dépôt dans votre wallet.');
      } else {
        setReservationError(rawMessage);
      }
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

  if (!annonce) {
    return (
      <Screen>
        <Enter index={0}>
          <EmptyState
            icon="alert-circle-outline"
            title="Annonce introuvable."
            body="Cette annonce a peut-être été supprimée ou déplacée."
            action="Retour accueil"
            onAction={() => router.replace('/(tabs)/home')}
          />
        </Enter>
      </Screen>
    );
  }

  const photos: string[] = annonce.photos?.length ? annonce.photos : [''];
  const ownerName = `${annonce.createur?.profil?.prenom || ''} ${annonce.createur?.profil?.nom || ''}`.trim();
  const ownerScore = Number(annonce.createur?.profil?.lBarakaScore ?? 0);
  const ownerPalier = String(annonce.createur?.profil?.palier || 'BRONZE');
  const ownerVille = String(annonce.createur?.profil?.ville || 'N/A');
  const cautionText =
    annonce.montantCaution !== null && annonce.montantCaution !== undefined
      ? `${String(annonce.montantCaution)} MAD`
      : 'Sans caution';

  const infoCells = [
    { icon: 'pricetag-outline' as const, label: 'État', value: String(annonce.condition || 'N/A') },
    { icon: 'calendar-outline' as const, label: 'Publie le', value: formatDate(annonce.dateCreation) },
    { icon: 'eye-outline' as const, label: 'Vues', value: String(annonce.nombreVues || 0) },
    { icon: 'time-outline' as const, label: 'Expiration', value: annonce.dateExpiration ? formatDateTime(annonce.dateExpiration) : 'Aucune' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ height: 340, backgroundColor: c.surface2 }}>
          <FlatList
            ref={pagerRef}
            horizontal
            pagingEnabled
            data={photos}
            keyExtractor={(_, i) => `${annonce.id}-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setPhotoIndex(Math.min(Math.max(idx, 0), photos.length - 1));
            }}
            renderItem={({ item: photo }) => (
              <View style={{ width, height: 340, backgroundColor: c.surface2 }}>
                <SmartAnnonceImage uri={photo} className="w-full h-full" resizeMode="cover" />
              </View>
            )}
          />
          <View style={{ position: 'absolute', top: insets.top + 12, left: 20 }}>
            <PressableScale
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.surface,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadowSm(mode),
              }}
            >
              <Ionicons name="arrow-back" size={20} color={c.ink} />
            </PressableScale>
          </View>
          <View style={{ position: 'absolute', bottom: 40, right: 20 }}>
            <Tag label={`${photoIndex + 1}/${photos.length}`} tone="muted" />
          </View>
        </View>

        <View
          style={{
            marginTop: -28,
            backgroundColor: c.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          <Enter index={0}>
            <View>
              <T kind="overline" color={c.primary}>
                Détail annonce
              </T>
              <T kind="display" style={{ marginTop: 6 }}>
                {annonce.titre}
              </T>
            </View>
          </Enter>

          <Enter index={1}>
            <View style={{ marginTop: 14, flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: c.goldSoft,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={c.onGoldSoft} />
                <View style={{ flex: 1 }}>
                  <T kind="caption" color={c.onGoldSoft}>
                    Caution
                  </T>
                  <T kind="bodyStrong" color={c.onGoldSoft} style={{ marginTop: 2 }}>
                    {cautionText}
                  </T>
                </View>
              </View>
              <View style={{ justifyContent: 'center' }}>
                <Tag label={String(annonce.statut || 'N/A')} tone={statutTone(annonce.statut)} />
              </View>
            </View>
          </Enter>

          <Enter index={2}>
            <View style={{ marginTop: 16 }}>
              <SectionHeader title="Propriétaire" />
              <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Avatar name={ownerName || annonce.createur?.profil?.prenom || '?'} size={52} />
                <View style={{ flex: 1 }}>
                  <T kind="bodyStrong" numberOfLines={1}>
                    {ownerName || 'Propriétaire'}
                  </T>
                  <T kind="small" color={c.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                    {ownerVille}
                  </T>
                  <View style={{ marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View
                      style={{
                        backgroundColor: c.goldSoft,
                        borderRadius: radius.pill,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="star" size={13} color={c.gold} />
                      <T kind="caption" color={c.onGoldSoft}>
                        {`${ownerScore}`}
                      </T>
                    </View>
                    <Tag label={ownerPalier} tone="gold" />
                  </View>
                </View>
              </Card>
            </View>
          </Enter>

          <Enter index={3}>
            <View style={{ marginTop: 20 }}>
              <SectionHeader title="Informations" />
              <Card style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {infoCells.map((cell) => (
                    <View
                      key={cell.label}
                      style={{
                        width: '48%',
                        flexGrow: 1,
                        backgroundColor: c.surface2,
                        borderRadius: radius.md,
                        padding: 12,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={cell.icon} size={16} color={c.primary} />
                        <T kind="caption" color={c.muted}>
                          {cell.label}
                        </T>
                      </View>
                      <T kind="bodyStrong" numberOfLines={2}>
                        {cell.value}
                      </T>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          </Enter>

          <Enter index={4}>
            <View style={{ marginTop: 20 }}>
              <SectionHeader title="Description" />
              <Card style={{ marginTop: 12 }}>
                <T kind="body" color={c.ink2}>
                  {annonce.description}
                </T>
                {annonce.prixSymbolique !== null && annonce.prixSymbolique !== undefined ? (
                  <View style={{ marginTop: 14, backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="pricetag-outline" size={18} color={c.primary} />
                    <T kind="bodyStrong">
                      Prix: {String(annonce.prixSymbolique)} MAD
                    </T>
                  </View>
                ) : null}
                {annonce.estFoodRescue ? (
                  <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                    <Tag label="Food Rescue" tone="gold" />
                  </View>
                ) : null}
              </Card>
            </View>
          </Enter>

          {!isOwner && reservationError ? (
            <Enter index={5}>
              <View style={{ marginTop: 16, backgroundColor: c.dangerSoft, borderRadius: radius.md, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
                  <T kind="small" color={c.onDangerSoft} style={{ flex: 1 }}>
                    {reservationError}
                  </T>
                </View>
                <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                  <PressableScale
                    onPress={() => router.push('/(tabs)/wallet')}
                    style={{ backgroundColor: c.surface, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 10 }}
                  >
                    <T kind="bodyStrong" color={c.danger}>
                      Aller au wallet
                    </T>
                  </PressableScale>
                </View>
              </View>
            </Enter>
          ) : null}

          {!isOwner && annonce.statut !== 'DISPONIBLE' ? (
            <Enter index={5}>
              <Card style={{ marginTop: 16, backgroundColor: c.goldSoft }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="pause-circle-outline" size={20} color={c.onGoldSoft} />
                  <T kind="bodyStrong" color={c.onGoldSoft} style={{ flex: 1 }}>
                    Annonce indisponible (Réservée/Terminée)
                  </T>
                </View>
              </Card>
            </Enter>
          ) : null}

          {isOwner ? (
            <Enter index={6}>
              <View style={{ marginTop: 16, gap: 12 }}>
                <Card style={{ backgroundColor: c.goldSoft }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <Ionicons name="information-circle-outline" size={20} color={c.onGoldSoft} />
                    <T kind="small" color={c.onGoldSoft} style={{ flex: 1 }}>
                      Cette annonce vous appartient. Vous pouvez la supprimer depuis cet écran.
                    </T>
                  </View>
                </Card>
                <Button
                  title="Modifier l'annonce"
                  variant="secondary"
                  icon="create-outline"
                  onPress={() => router.push(`/(annonces)/edit/${annonce.id}`)}
                />
                <Button
                  title={isDeleting ? 'Suppression...' : "Supprimer l'annonce"}
                  variant="danger"
                  icon="trash-outline"
                  loading={isDeleting}
                  onPress={deleteAnnonce}
                />
              </View>
            </Enter>
          ) : null}

          <Enter index={7}>
            <View style={{ marginTop: 16, gap: 12, marginBottom: 8 }}>
              <Button
                title="Voir les transactions"
                variant="secondary"
                icon="swap-horizontal-outline"
                onPress={() => router.push('/(tabs)/transactions')}
              />
              <Button
                title="Retour accueil"
                variant="ghost"
                icon="home-outline"
                onPress={() => router.push('/(tabs)/home')}
              />
            </View>
          </Enter>
        </View>
      </ScrollView>

      {!isOwner ? (
        <View
          style={{
            backgroundColor: c.surface,
            borderTopWidth: 1,
            borderTopColor: c.line,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            flexDirection: 'row',
            gap: 10,
            ...shadowMd(mode),
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              title="Discuter"
              variant="secondary"
              icon="chatbubble-outline"
              onPress={() => {
                router.push(`/(tabs)/chat?openChat=${annonce.id}&otherId=${annonce.createurId}`);
              }}
            />
          </View>
          <View style={{ flex: 1.4 }}>
            {annonce.statut === 'DISPONIBLE' ? (
              <Button
                title={isReserving ? 'Réservation...' : 'Réserver'}
                icon="bag-check-outline"
                loading={isReserving}
                onPress={reserveAnnonce}
              />
            ) : (
              <Button title="Indisponible" variant="secondary" icon="pause-circle-outline" onPress={() => {}} />
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}
