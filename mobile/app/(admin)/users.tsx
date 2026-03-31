import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top + 10 }}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e3a8a" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} className="flex-row items-center gap-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white items-center justify-center shadow-sm border border-slate-200"
          >
            <Ionicons name="arrow-back" size={20} color="#1e3a8a" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-slate-500">Administration</Text>
            <Text className="text-lg font-extrabold text-slate-900">Utilisateurs</Text>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="mb-4">
          <View className="bg-white rounded-xl p-3 flex-row items-center gap-2 shadow-sm border border-slate-200">
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher par nom, email, CIN..."
              className="flex-1 text-sm text-slate-900"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-500">Total utilisateurs</Text>
              <Text className="text-2xl font-extrabold text-blue-900 mt-1">{meta?.total || 0}</Text>
            </View>
            <View className="bg-blue-100 rounded-full p-3">
              <Ionicons name="people" size={24} color="#1e3a8a" />
            </View>
          </View>
        </Animated.View>

        {/* Users List */}
        {users.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200).duration(600)} className="bg-white rounded-xl p-6 items-center shadow-sm border border-slate-200">
            <Ionicons name="people-outline" size={32} color="#94a3b8" />
            <Text className="text-sm text-slate-500 mt-3">Aucun utilisateur trouvé</Text>
          </Animated.View>
        ) : (
          users.map((user, index) => (
            <Animated.View key={user.id} entering={FadeInUp.delay(200 + index * 50).duration(600)}>
              <Pressable
                onPress={() => {
                  setSelectedUser(user);
                  setShowModal(true);
                }}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-200"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{user.email}</Text>
                    {user.profil && (
                      <Text className="text-xs text-slate-500 mt-1">
                        {user.profil.prenom} {user.profil.nom}
                      </Text>
                    )}
                  </View>
                  <View className={`px-2 py-1 rounded-lg ${user.isBlocked ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-[10px] font-bold ${user.isBlocked ? 'text-red-800' : 'text-green-800'}`}>
                      {user.isBlocked ? 'BLOQUÉ' : 'ACTIF'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-4 mt-2">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="shield" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-600">{user.role}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="wallet" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-600">{user.solde} MAD</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-600">
                      {new Date(user.dateInscription).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <Animated.View entering={FadeInUp.delay(300).duration(600)} className="flex-row gap-2 mt-4">
            <Pressable
              onPress={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`flex-1 py-3 rounded-xl ${page === 1 ? 'bg-slate-200' : 'bg-blue-900'}`}
            >
              <Text className={`text-center text-sm font-bold ${page === 1 ? 'text-slate-400' : 'text-white'}`}>
                Précédent
              </Text>
            </Pressable>
            <View className="bg-white rounded-xl px-4 py-3 border border-slate-200">
              <Text className="text-sm font-bold text-slate-900">{page} / {meta.lastPage}</Text>
            </View>
            <Pressable
              onPress={() => setPage(Math.min(meta.lastPage, page + 1))}
              disabled={page === meta.lastPage}
              className={`flex-1 py-3 rounded-xl ${page === meta.lastPage ? 'bg-slate-200' : 'bg-blue-900'}`}
            >
              <Text className={`text-center text-sm font-bold ${page === meta.lastPage ? 'text-slate-400' : 'text-white'}`}>
                Suivant
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal User Details */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">Détails utilisateur</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-slate-50 rounded-xl p-4 mb-4">
                  <Text className="text-xs text-slate-500 mb-1">Email</Text>
                  <Text className="text-sm font-bold text-slate-900">{selectedUser.email}</Text>
                </View>

                <View className="bg-slate-50 rounded-xl p-4 mb-4">
                  <Text className="text-xs text-slate-500 mb-1">Téléphone</Text>
                  <Text className="text-sm font-bold text-slate-900">{selectedUser.telephone}</Text>
                </View>

                <View className="bg-slate-50 rounded-xl p-4 mb-4">
                  <Text className="text-xs text-slate-500 mb-1">Rôle actuel</Text>
                  <Text className="text-sm font-bold text-blue-900">{selectedUser.role}</Text>
                </View>

                <Text className="text-sm font-bold text-slate-700 mb-3">Actions</Text>

                <Pressable
                  onPress={() => handleBlockUser(selectedUser.id, selectedUser.isBlocked)}
                  className={`rounded-xl py-3 mb-2 ${selectedUser.isBlocked ? 'bg-green-600' : 'bg-red-600'}`}
                >
                  <Text className="text-center text-sm font-bold text-white">
                    {selectedUser.isBlocked ? 'Débloquer' : 'Bloquer'} l'utilisateur
                  </Text>
                </Pressable>

                {selectedUser.role !== 'ADMINISTRATEUR' && (
                  <Pressable
                    onPress={() => handleChangeRole(selectedUser.id, 'ADMINISTRATEUR')}
                    className="bg-blue-900 rounded-xl py-3"
                  >
                    <Text className="text-center text-sm font-bold text-white">
                      Promouvoir en Admin
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
