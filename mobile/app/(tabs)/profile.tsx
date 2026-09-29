import { useState, useCallback } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '@/services/api';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadowSm } from '@/theme/tokens';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Chip';
import { T } from '@/components/ui/T';
import { Avatar } from '@/components/ui/Primitives';
import { PressableScale } from '@/components/ui/PressableScale';
import { Enter } from '@/components/ui/Enter';
import { Segmented } from '@/components/ui/Segmented';

export default function ProfileScreen() {
  const router = useRouter();
  const { c, mode, setMode } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setIsAdmin(parsed?.role === 'ADMINISTRATEUR');
        }
        return;
      }

      try {
        const data = await ApiService.getUserProfile(token);
        setUser(data.utilisateur);
        setIsAdmin(data.utilisateur?.role === 'ADMINISTRATEUR');
        await AsyncStorage.setItem('user', JSON.stringify(data.utilisateur));
      } catch {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setIsAdmin(parsed?.role === 'ADMINISTRATEUR');
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAdmin(parsed?.role === 'ADMINISTRATEUR');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (token) {
                await ApiService.logout(token);
              }
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('user');
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const displayName =
    user?.profil?.prenom || user?.profil?.nom
      ? `${user?.profil?.prenom || ''} ${user?.profil?.nom || ''}`.trim()
      : 'Utilisateur';

  const compteItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    caption: string;
    onPress: () => void;
  }[] = [
    { icon: 'person-outline', label: 'Modifier le profil', caption: 'Nom, ville et coordonnées', onPress: () => router.push('/edit-profile') },
    { icon: 'wallet-outline', label: 'Mon portefeuille', caption: 'Solde, dépôts et retraits', onPress: () => router.push('/(tabs)/wallet') },
    { icon: 'albums-outline', label: 'Mes annonces', caption: 'Gérer mes publications', onPress: () => router.push('/(annonces)/mine') },
  ];

  const appItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    caption: string;
    onPress: () => void;
  }[] = [
    { icon: 'location-outline', label: 'Points relais', caption: 'Trouver un point proche', onPress: () => router.push('/(points-relais)/') },
  ];

  return (
    <Screen scroll padBottom={108} pad={0}>
      <View style={{ height: 190, backgroundColor: c.primary, paddingHorizontal: 20, paddingTop: 16, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: c.onPrimary,
            opacity: 0.1,
            top: -80,
            right: -60,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: c.onPrimary,
            opacity: 0.08,
            bottom: -50,
            left: 40,
          }}
        />
        <T kind="overline" color={c.onPrimary} style={{ opacity: 0.7 }}>
          Espace personnel
        </T>
        <T kind="h1" color={c.onPrimary} style={{ marginTop: 4 }} numberOfLines={1}>
          {displayName}
        </T>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Enter index={0}>
          <View style={{ marginTop: -42 }}>
            <Avatar name={displayName} size={84} />
          </View>
        </Enter>

        <Enter index={1}>
          <View style={{ marginTop: 12 }}>
            <T kind="h1" numberOfLines={1}>
              {displayName}
            </T>
            {user?.email ? (
              <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                {user.email}
              </T>
            ) : null}
            {user?.telephone ? (
              <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                {user.telephone}
              </T>
            ) : null}

            {user ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: c.surface2,
                    borderRadius: radius.md,
                    paddingVertical: 12,
                    gap: 2,
                  }}
                >
                  <Ionicons name="star" size={16} color={c.gold} />
                  <T kind="h2" color={c.gold}>
                    {user.profil?.lBarakaScore || 0}
                  </T>
                  <T kind="caption" color={c.muted}>
                    Points
                  </T>
                </View>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: c.surface2,
                    borderRadius: radius.md,
                    paddingVertical: 12,
                    gap: 2,
                  }}
                >
                  <Ionicons name="ribbon" size={16} color={c.gold} />
                  <T kind="h3" numberOfLines={1} style={{ marginTop: 2 }}>
                    {user.profil?.palier || 'BRONZE'}
                  </T>
                  <T kind="caption" color={c.muted}>
                    Palier
                  </T>
                </View>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: c.surface2,
                    borderRadius: radius.md,
                    paddingVertical: 12,
                    gap: 2,
                  }}
                >
                  <Ionicons name="medal" size={16} color={c.gold} />
                  <T kind="h2" color={c.gold}>
                    {user.profil?.badges?.length || 0}
                  </T>
                  <T kind="caption" color={c.muted}>
                    Badges
                  </T>
                </View>
              </View>
            ) : null}

            {user?.profil?.palier ? (
              <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                <Tag label={String(user.profil.palier)} tone="gold" />
              </View>
            ) : null}
          </View>
        </Enter>

        <Enter index={2}>
          <View
            style={{
              marginTop: 16,
              backgroundColor: c.primarySoft,
              borderRadius: radius.lg,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              ...shadowSm(mode),
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="leaf-outline" size={20} color={c.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="bodyStrong" color={c.onPrimarySoft}>
                Impact personnel
              </T>
              <T kind="small" color={c.onPrimarySoft} style={{ marginTop: 2 }}>
                Continuez vos échanges pour progresser.
              </T>
            </View>
          </View>
        </Enter>

        <Enter index={3}>
          <View style={{ marginTop: 16 }}>
            <T kind="overline" color={c.muted} style={{ marginBottom: 8 }}>
              Compte
            </T>
            <Card pad={0} style={{ overflow: 'hidden' }}>
              {compteItems.map((item, i) => (
                <PressableScale
                  key={item.label}
                  onPress={item.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    backgroundColor: 'transparent',
                    borderBottomWidth: i === compteItems.length - 1 ? 0 : 1,
                    borderBottomColor: c.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={c.primary} />
                    </View>
                    <View>
                      <T kind="bodyStrong">{item.label}</T>
                      <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                        {item.caption}
                      </T>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.muted} />
                </PressableScale>
              ))}
            </Card>
          </View>
        </Enter>

        <Enter index={4}>
          <View style={{ marginTop: 16 }}>
            <T kind="overline" color={c.muted} style={{ marginBottom: 8 }}>
              Preferences
            </T>
            <Card style={{ gap: 14 }}>
              <View>
                <T kind="bodyStrong">Theme</T>
                <T kind="small" color={c.muted} style={{ marginTop: 2, marginBottom: 10 }}>
                  {mode === 'light' ? 'Mode clair actif' : 'Mode sombre actif'}
                </T>
                <Segmented
                  options={[
                    { value: 'light', label: 'Clair' },
                    { value: 'dark', label: 'Sombre' },
                  ]}
                  value={mode}
                  onChange={(v) => setMode(v)}
                />
              </View>
              <PressableScale
                onPress={() => router.push('/edit-profile')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopWidth: 1,
                  borderTopColor: c.line,
                  paddingTop: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.md,
                      backgroundColor: c.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="language-outline" size={20} color={c.primary} />
                  </View>
                  <View>
                    <T kind="bodyStrong">Langue</T>
                    <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                      Francais, gerer dans le profil
                    </T>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.muted} />
              </PressableScale>
            </Card>
          </View>
        </Enter>

        <Enter index={5}>
          <View style={{ marginTop: 16 }}>
            <T kind="overline" color={c.muted} style={{ marginBottom: 8 }}>
              Application
            </T>
            <Card pad={0} style={{ overflow: 'hidden' }}>
              {appItems.map((item, i) => (
                <PressableScale
                  key={item.label}
                  onPress={item.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    backgroundColor: 'transparent',
                    borderBottomWidth: isAdmin ? 1 : i === appItems.length - 1 ? 0 : 1,
                    borderBottomColor: c.line,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={c.primary} />
                    </View>
                    <View>
                      <T kind="bodyStrong">{item.label}</T>
                      <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                        {item.caption}
                      </T>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.muted} />
                </PressableScale>
              ))}
              {isAdmin ? (
                <PressableScale
                  onPress={() => router.push('/(admin)/dashboard')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    backgroundColor: 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: c.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="shield-checkmark-outline" size={20} color={c.primary} />
                    </View>
                    <View>
                      <T kind="bodyStrong">Administration</T>
                      <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                        Tableau de bord admin
                      </T>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.muted} />
                </PressableScale>
              ) : null}
            </Card>
          </View>
        </Enter>

        <Enter index={6}>
          <View style={{ marginTop: 20, marginBottom: 8 }}>
            <Button
              title={isLoading ? 'Déconnexion...' : 'Se déconnecter'}
              variant="danger"
              icon="log-out-outline"
              loading={isLoading}
              onPress={handleLogout}
            />
            <T kind="caption" color={c.muted} center style={{ marginTop: 14 }}>
              LBaraka v1.0.0
            </T>
          </View>
        </Enter>
        {isLoading && !user ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
