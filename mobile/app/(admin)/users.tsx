import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
      <View className="flex-1 bg-[#0e0e0e] items-center justify-center">
        <ActivityIndicator size="large" color="#c0c1ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0e0e0e]" style={{ paddingTop: insets.top }}>
      {/* TopAppBar */}
      <View className="bg-[#131313] border-b border-[#464554]/20 px-6 h-16 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center hover:bg-[#353534] rounded-sm">
          <Ionicons name="arrow-back" size={20} color="#c0c1ff" />
        </Pressable>
        <View className="flex-1 ml-3">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c0c1ff]/80">System Oversight</Text>
          <Text className="text-lg font-light text-[#e5e2e1]">User Registry</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c1ff" />}
      >
        {/* Search */}
        <View className="bg-[#1c1b1b] rounded-sm flex-row items-center px-4 py-4 mb-6 border border-[#464554]/20">
          <Ionicons name="search" size={20} color="#908fa0" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="SEARCH SYSTEM NODES OR IDENTITIES..."
            placeholderTextColor="#908fa0"
            className="flex-1 text-[#e5e2e1] text-sm uppercase tracking-wider ml-3"
          />
        </View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.duration(600)} className="bg-[#1c1b1b] p-8 rounded-sm mb-6 border border-[#464554]/10">
          <View className="absolute top-0 right-0 p-4 opacity-10">
            <Ionicons name="people" size={60} color="#e5e2e1" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-[0.1em] text-[#c7c4d7] mb-6">Active Identities</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-6xl font-light tracking-tighter text-[#e5e2e1]">{meta?.total || 0}</Text>
            <Text className="text-sm font-medium text-[#ffb783]">Registered</Text>
          </View>
        </Animated.View>

        {/* Users Grid */}
        {users.length === 0 ? (
          <View className="bg-[#1c1b1b] rounded-sm items-center p-8 border border-[#464554]/10">
            <Ionicons name="people-outline" size={32} color="#908fa0" />
            <Text className="text-sm text-[#c7c4d7] mt-3">No users found</Text>
          </View>
        ) : (
          <View className="gap-6">
            {users.map((user, index) => (
              <Animated.View key={user.id} entering={FadeInUp.delay(100 + index * 50).duration(600)}>
                <Pressable
                  onPress={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                  className="bg-[#1c1b1b] border border-[#464554]/10 hover:border-[#c0c1ff]/20 p-6 rounded-sm relative overflow-hidden"
                >
                  <View className="absolute top-0 right-0 w-24 h-24 bg-[#c0c1ff]/5 blur-[40px] rounded-full -mr-12 -mt-12" />
                  <View className="flex-row items-start justify-between mb-8">
                    <View className="flex-row items-center gap-4 flex-1">
                      <View className="relative">
                        <View className="w-14 h-14 rounded-sm border border-[#464554]/30 bg-[#353534] items-center justify-center">
                          <Ionicons name="person" size={24} color="#c0c1ff" />
                        </View>
                        <View className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1c1b1b] ${user.isBlocked ? 'bg-[#ffb4ab]' : 'bg-[#4ade80]'}`} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-medium text-[#e5e2e1]" numberOfLines={1}>{user.email}</Text>
                        <Text className="text-[10px] font-semibold uppercase tracking-widest text-[#c0c1ff]/70 mt-1">
                          {user.role}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="gap-4 mb-8">
                    {user.profil && (
                      <View>
                        <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60">Identity</Text>
                        <Text className="text-sm text-[#c7c4d7] mt-1">{user.profil.prenom} {user.profil.nom}</Text>
                      </View>
                    )}
                    <View>
                      <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60">Registry Entry</Text>
                      <Text className="text-sm text-[#c7c4d7] mt-1">
                        {new Date(user.dateInscription).toLocaleDateString('fr-FR')} • {user.solde} MAD
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between pt-4 border-t border-[#464554]/10">
                    <View className="flex-row gap-1">
                      <View className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-[#ffb4ab]' : 'bg-[#c0c1ff] shadow-[0_0_8px_rgba(192,193,255,0.8)]'}`} />
                      <View className="w-1.5 h-1.5 rounded-full bg-[#464554]" />
                      <View className="w-1.5 h-1.5 rounded-full bg-[#464554]" />
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e5e2e1]">Manage</Text>
                      <Ionicons name="chevron-forward" size={14} color="#c0c1ff" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <View className="flex-row gap-3 mt-6 items-center justify-center">
            <Pressable
              onPress={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`flex-1 py-3 rounded-sm items-center ${page === 1 ? 'bg-[#1c1b1b]' : 'bg-[#8083ff]'}`}
            >
              <Text className={`text-sm font-bold uppercase tracking-wider ${page === 1 ? 'text-[#908fa0]' : 'text-[#0d0096]'}`}>Prev</Text>
            </Pressable>
            <View className="bg-[#1c1b1b] rounded-sm px-6 py-3 border border-[#464554]/20">
              <Text className="text-sm font-bold text-[#c0c1ff]">{page} / {meta.lastPage}</Text>
            </View>
            <Pressable
              onPress={() => setPage(Math.min(meta.lastPage, page + 1))}
              disabled={page === meta.lastPage}
              className={`flex-1 py-3 rounded-sm items-center ${page === meta.lastPage ? 'bg-[#1c1b1b]' : 'bg-[#8083ff]'}`}
            >
              <Text className={`text-sm font-bold uppercase tracking-wider ${page === meta.lastPage ? 'text-[#908fa0]' : 'text-[#0d0096]'}`}>Next</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Modal User Details */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#131313] rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-light text-[#c0c1ff]">User Details</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#908fa0" />
              </Pressable>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-[#1c1b1b] rounded-sm p-4 mb-3">
                  <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60 mb-1">Email</Text>
                  <Text className="text-base font-medium text-[#e5e2e1]">{selectedUser.email}</Text>
                </View>
                <View className="bg-[#1c1b1b] rounded-sm p-4 mb-3">
                  <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60 mb-1">Phone</Text>
                  <Text className="text-base font-medium text-[#e5e2e1]">{selectedUser.telephone}</Text>
                </View>
                <View className="bg-[#1c1b1b] rounded-sm p-4 mb-6">
                  <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60 mb-1">Role</Text>
                  <Text className="text-base font-medium text-[#c0c1ff]">{selectedUser.role}</Text>
                </View>
                <Text className="text-base font-medium text-[#e5e2e1] mb-3">Actions</Text>
                <Pressable
                  onPress={() => handleBlockUser(selectedUser.id, selectedUser.isBlocked)}
                  className={`rounded-sm py-4 mb-3 items-center ${selectedUser.isBlocked ? 'bg-[#4ade80]' : 'bg-[#ffb4ab]'}`}
                >
                  <Text className="text-base font-bold text-[#131313]">
                    {selectedUser.isBlocked ? 'Unblock' : 'Block'} User
                  </Text>
                </Pressable>
                {selectedUser.role !== 'ADMINISTRATEUR' && (
                  <Pressable
                    onPress={() => handleChangeRole(selectedUser.id, 'ADMINISTRATEUR')}
                    className="bg-[#8083ff] rounded-sm py-4 items-center"
                  >
                    <Text className="text-base font-bold text-[#0d0096]">
                      Promote to Admin
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
