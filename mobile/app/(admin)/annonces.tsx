import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import SmartAnnonceImage from '../../components/smart-annonce-image';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { T } from '../../components/ui/T';
import { EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

function statutTone(statut?: string): 'success' | 'info' | 'muted' | 'gold' {
  if (statut === 'DISPONIBLE') return 'success';
  if (statut === 'EMPRUNTEE') return 'info';
  if (statut === 'INDISPONIBLE') return 'muted';
  return 'gold';
}

export default function AdminAnnonces() {
  const router = useRouter();
  const { c } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAnnonces();
    }, [])
  );

  const loadAnnonces = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAdminAnnonces(token, 1, 50);
      setAnnonces(data.annonces || []);
    } catch (error) {
      console.error('Error loading annonces:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnonces();
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement des annonces...
          </T>
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
            <T kind="overline" color={c.primary}>Console admin</T>
            <T kind="h2" style={{ marginTop: 2 }}>Annonces</T>
          </View>
          <Tag label={`${annonces.length} objets`} tone="primary" />
        </View>
      </Enter>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        style={{ marginTop: 16 }}
      >
        <Enter index={1}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="megaphone-outline" size={22} color={c.onPrimarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="h1">{String(annonces.length)}</T>
              <T kind="small" color={c.muted}>Annonces publiées</T>
            </View>
            <Tag label="Registre" tone="primary" />
          </Card>
        </Enter>

        <Enter index={2}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Toutes les annonces" action="Actualiser" onAction={onRefresh} />
          </View>
        </Enter>

        {annonces.length === 0 ? (
          <Enter index={3}>
            <Card style={{ marginTop: 12 }}>
              <EmptyState
                icon="megaphone-outline"
                title="Aucune annonce"
                body="Aucune annonce publiée pour le moment."
              />
            </Card>
          </Enter>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
            {annonces.map((annonce, index) => (
              <Enter key={annonce.id} index={Math.min(index, 6)}>
                <PressableScale onPress={() => router.push(`/(annonces)/${annonce.id}`)}>
                  <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 84, height: 84, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface2 }}>
                      <SmartAnnonceImage
                        uri={annonce.photos?.[0]}
                        className="w-full h-full overflow-hidden"
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T kind="bodyStrong" numberOfLines={1}>
                        {annonce.titre}
                      </T>
                      <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                        {annonce.description}
                      </T>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        <Tag label={String(annonce.categorie || 'N/A')} tone="info" />
                        <Tag label={String(annonce.statut || 'N/A')} tone={statutTone(annonce.statut)} />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.muted} />
                  </Card>
                </PressableScale>
              </Enter>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
