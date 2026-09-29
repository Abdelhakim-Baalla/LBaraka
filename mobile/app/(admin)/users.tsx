import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { TextField } from '../../components/ui/TextField';
import { T } from '../../components/ui/T';
import { Avatar, EmptyState } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

function roleTone(role?: string): 'primary' | 'gold' | 'info' | 'muted' {
  if (role === 'ADMINISTRATEUR') return 'primary';
  if (role === 'PARTENAIRE') return 'gold';
  if (role === 'UTILISATEUR') return 'info';
  return 'muted';
}

export default function AdminUsers() {
  const router = useRouter();
  const { c } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [page, search])
  );

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAdminUsers(token, page, 20, search);
      setUsers(data.users || []);
      setMeta(data.meta);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await ApiService.updateUserStatus(token, userId, !isBlocked);
      Alert.alert('Succès', `Utilisateur ${!isBlocked ? 'bloqué' : 'débloqué'}`);
      loadUsers();
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de modifier le statut');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await ApiService.updateUserRole(token, userId, newRole);
      Alert.alert('Succès', 'Rôle modifié');
      loadUsers();
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de modifier le rôle');
    }
  };

  const openActions = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement des utilisateurs...
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
            <T kind="h2" style={{ marginTop: 2 }}>Utilisateurs</T>
          </View>
          <Tag label={`${meta?.total || users.length} comptes`} tone="primary" />
        </View>
      </Enter>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        style={{ marginTop: 16 }}
      >
        <Enter index={1}>
          <TextField
            label="Rechercher"
            icon="search-outline"
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, email ou téléphone..."
          />
        </Enter>

        <Enter index={2}>
          <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
              <Ionicons name="people-outline" size={22} color={c.onPrimarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="h1">{String(meta?.total || 0)}</T>
              <T kind="small" color={c.muted}>Comptes enregistrés</T>
            </View>
            <Tag label="Registre" tone="primary" />
          </Card>
        </Enter>

        {users.length === 0 ? (
          <Enter index={3}>
            <Card style={{ marginTop: 16 }}>
              <EmptyState
                icon="people-outline"
                title="Aucun utilisateur"
                body="Aucun compte ne correspond à cette recherche."
              />
            </Card>
          </Enter>
        ) : (
          <View style={{ gap: 12, marginTop: 16 }}>
            {users.map((user, index) => (
              <Enter key={user.id} index={Math.min(index, 6)}>
                <PressableScale
                  onPress={() => router.push(`/(admin)/user-details?id=${user.id}`)}
                  onLongPress={() => openActions(user)}
                >
                  <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View>
                      <Avatar name={user.profil ? `${user.profil.prenom || ''} ${user.profil.nom || ''}`.trim() : user.email} size={48} />
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: user.isBlocked ? c.danger : c.success,
                          borderWidth: 2,
                          borderColor: c.surface,
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T kind="bodyStrong" numberOfLines={1}>{user.email}</T>
                      {user.profil ? (
                        <T kind="small" color={c.ink2} numberOfLines={1} style={{ marginTop: 2 }}>
                          {user.profil.prenom} {user.profil.nom}
                        </T>
                      ) : null}
                      <T kind="caption" color={c.muted} style={{ marginTop: 4 }}>
                        Solde {user.solde} MAD
                      </T>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        <Tag label={user.role} tone={roleTone(user.role)} />
                        <Tag label={user.isBlocked ? 'Bloqué' : 'Actif'} tone={user.isBlocked ? 'danger' : 'success'} />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.muted} />
                  </Card>
                </PressableScale>
              </Enter>
            ))}
          </View>
        )}

        {meta && meta.lastPage > 1 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Précédent"
                size="md"
                variant={page === 1 ? 'ghost' : 'secondary'}
                icon="chevron-back-outline"
                onPress={() => setPage(Math.max(1, page - 1))}
              />
            </View>
            <Card pad={12} flat>
              <T kind="bodyStrong" color={c.primary}>{page} / {meta.lastPage}</T>
            </Card>
            <View style={{ flex: 1 }}>
              <Button
                title="Suivant"
                size="md"
                variant={page === meta.lastPage ? 'ghost' : 'secondary'}
                iconAfter="chevron-forward-outline"
                onPress={() => setPage(Math.min(meta.lastPage, page + 1))}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <T kind="h2">Détails utilisateur</T>
              <PressableScale onPress={() => setShowModal(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={c.muted} />
              </PressableScale>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Card flat style={{ backgroundColor: c.surface2 }}>
                  <T kind="caption" color={c.muted}>Email</T>
                  <T kind="bodyStrong" style={{ marginTop: 4 }}>{selectedUser.email}</T>
                </Card>
                <Card flat style={{ backgroundColor: c.surface2, marginTop: 10 }}>
                  <T kind="caption" color={c.muted}>Téléphone</T>
                  <T kind="bodyStrong" style={{ marginTop: 4 }}>{selectedUser.telephone}</T>
                </Card>
                <Card flat style={{ backgroundColor: c.surface2, marginTop: 10 }}>
                  <T kind="caption" color={c.muted}>Rôle</T>
                  <T kind="bodyStrong" color={c.primary} style={{ marginTop: 4 }}>{selectedUser.role}</T>
                </Card>
                <T kind="h3" style={{ marginTop: 20, marginBottom: 12 }}>Actions</T>
                <Button
                  title={selectedUser.isBlocked ? 'Débloquer' : 'Bloquer'}
                  variant={selectedUser.isBlocked ? 'secondary' : 'danger'}
                  icon={selectedUser.isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
                  onPress={() => handleBlockUser(selectedUser.id, selectedUser.isBlocked)}
                />
                {selectedUser.role !== 'ADMINISTRATEUR' && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title="Promouvoir admin"
                      variant="secondary"
                      icon="shield-checkmark-outline"
                      onPress={() => handleChangeRole(selectedUser.id, 'ADMINISTRATEUR')}
                    />
                  </View>
                )}
                <View style={{ marginTop: 12 }}>
                  <Button
                    title="Voir le dossier"
                    variant="ghost"
                    icon="person-outline"
                    onPress={() => {
                      setShowModal(false);
                      router.push(`/(admin)/user-details?id=${selectedUser.id}`);
                    }}
                  />
                </View>
                <View style={{ height: 12 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
