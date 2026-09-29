import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { EmptyState } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

export default function MyAnnoncesScreen() {
  const router = useRouter();
  const { c } = useTheme();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  // Charge les annonces de l'utilisateur
  const loadMyAnnonces = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getMyAnnonces(token);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('My annonces load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMyAnnonces();
    }, [])
  );

  // Rafraîchit la liste
  const onRefresh = () => {
    setRefreshing(true);
    loadMyAnnonces();
  };

  // Supprime une annonce avec confirmation
  const deleteAnnonce = async (annonceId: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(annonceId);
            const token = await AsyncStorage.getItem('accessToken');

            if (!token) {
              router.replace('/(auth)/sign-in');
              return;
            }

            await ApiService.deleteAnnonce(token, annonceId);
            await loadMyAnnonces();
          } catch (error: any) {
            Alert.alert('Erreur', error?.message || 'Suppression impossible.');
          } finally {
            setDeletingId('');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ marginTop: 8, gap: 12 }}>
          <View style={{ height: 48, borderRadius: radius.md, backgroundColor: c.surface2 }} />
          <Card>
            <T kind="h2">Mes annonces</T>
            <T kind="body" color={c.muted} style={{ marginTop: 4 }}>
              Chargement de vos annonces publiées...
            </T>
          </Card>
          {[0, 1].map((i) => (
            <Card key={i}>
              <View style={{ height: 150, borderRadius: radius.lg, backgroundColor: c.surface2 }} />
              <View style={{ height: 14, borderRadius: 7, backgroundColor: c.surface2, marginTop: 12 }} />
            </Card>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Enter index={0}>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableScale
            onPress={() => router.back()}
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
            <Ionicons name="arrow-back" size={20} color={c.ink} />
          </PressableScale>
          <View style={{ flex: 1 }}>
            <T kind="overline" color={c.primary}>Espace personnel</T>
            <T kind="h2" style={{ marginTop: 2 }}>Mes annonces</T>
          </View>
          <Tag label={`${annonces.length} objets`} tone="primary" />
        </View>
      </Enter>

      <Enter index={1}>
        <View style={{ marginTop: 16 }}>
          <Button title="Publier une annonce" icon="add" onPress={() => router.push('/(annonces)/create')} />
        </View>
      </Enter>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        style={{ marginTop: 16 }}
      >
        {annonces.length === 0 ? (
          <Enter index={2}>
            <Card style={{ marginTop: 4 }}>
              <EmptyState
                icon="albums-outline"
                title="Aucune annonce"
                body="Vous n'avez pas encore d'annonce."
                action="Créer une annonce"
                onAction={() => router.push('/(annonces)/create')}
              />
            </Card>
          </Enter>
        ) : (
          <View style={{ gap: 12 }}>
            {annonces.map((annonce, i) => (
              <Enter key={annonce.id} index={Math.min(i, 6)}>
                <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <PressableScale onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                    <View
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: radius.lg,
                        overflow: 'hidden',
                        backgroundColor: c.surface2,
                      }}
                    >
                      <SmartAnnonceImage
                        uri={annonce.photos?.[0]}
                        className="w-full h-full overflow-hidden"
                        resizeMode="cover"
                      />
                    </View>
                  </PressableScale>
                  <View style={{ flex: 1 }}>
                    <PressableScale onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                      <T kind="bodyStrong" numberOfLines={1}>{annonce.titre}</T>
                    </PressableScale>
                    <T kind="caption" color={c.muted} style={{ marginTop: 2 }}>
                      Créée le {annonce.dateCreation ? new Date(annonce.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}
                    </T>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      <Tag
                        label={annonce.montantCaution !== null && annonce.montantCaution !== undefined ? `${annonce.montantCaution} MAD` : 'Sans caution'}
                        tone="gold"
                      />
                      <Tag
                        label={String(annonce.statut || 'N/A')}
                        tone={annonce.statut === 'DISPONIBLE' ? 'success' : 'muted'}
                      />
                    </View>
                  </View>
                  <View style={{ gap: 8 }}>
                    <PressableScale
                      onPress={() => router.push(`/(annonces)/edit/${annonce.id}`)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={c.primary} />
                    </PressableScale>
                    <PressableScale
                      onPress={() => deleteAnnonce(annonce.id)}
                      disabled={deletingId === annonce.id}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: deletingId === annonce.id ? 0.6 : 1,
                      }}
                    >
                      {deletingId === annonce.id ? (
                        <ActivityIndicator size="small" color={c.danger} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color={c.danger} />
                      )}
                    </PressableScale>
                  </View>
                </Card>
              </Enter>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
