import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';

export default function AdminUserDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    cin: '',
    telephone: '',
    adresseComplete: '',
    ville: '',
    dateNaissance: '',
    role: '',
  });

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getAdminUserById(token, id as string);
      setUser(data);
      setFormData({
        nom: data.profil?.nom || '',
        prenom: data.profil?.prenom || '',
        cin: data.profil?.cin || '',
        telephone: data.telephone || '',
        adresseComplete: data.profil?.adresseComplete || '',
        ville: data.profil?.ville || '',
        dateNaissance: data.profil?.dateNaissance ? new Date(data.profil.dateNaissance).toISOString().split('T')[0] : '',
        role: data.role || '',
      });
    } catch (error) {
      console.error('Error loading user details:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      if (formData.role && formData.role !== user.role) {
        await ApiService.updateUserRole(token, id as string, formData.role);
      }

      await ApiService.updateAdminUserProfile(token, id as string, {
        nom: formData.nom,
        prenom: formData.prenom,
        cin: formData.cin,
        telephone: formData.telephone,
        adresseComplete: formData.adresseComplete,
        ville: formData.ville,
        dateNaissance: formData.dateNaissance
      });
      Alert.alert('Succès', 'Profil mis à jour');
      setIsEditing(false);
      loadUserDetails();
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) return;

              await ApiService.deleteAdminUser(token, id as string);
              Alert.alert('Succès', 'Utilisateur supprimé');
              router.back();
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0e0e0e] items-center justify-center">
        <ActivityIndicator size="large" color="#c0c1ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-[#0e0e0e] items-center justify-center">
        <Text className="text-[#e5e2e1]">Utilisateur non trouvé</Text>
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
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c0c1ff]/80">User Management</Text>
          <Text className="text-lg font-light text-[#e5e2e1]">User Details</Text>
        </View>
        {!isEditing && (
          <Pressable onPress={() => setIsEditing(true)} className="w-10 h-10 items-center justify-center hover:bg-[#353534] rounded-sm">
            <Ionicons name="create-outline" size={20} color="#c0c1ff" />
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
        {/* User Info Card */}
        <Animated.View entering={FadeInUp.duration(600)} className="bg-[#1c1b1b] p-6 rounded-sm mb-6 border border-[#464554]/10">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-16 h-16 rounded-sm bg-[#353534] items-center justify-center">
              <Ionicons name="person" size={32} color="#c0c1ff" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-medium text-[#e5e2e1]">{user.email}</Text>
              <View className={`mt-2 px-3 py-1 rounded-sm self-start ${user.isBlocked ? 'bg-[#ffb4ab]/10 border border-[#ffb4ab]/20' : 'bg-[#4ade80]/10 border border-[#4ade80]/20'}`}>
                <Text className={`text-[10px] font-bold uppercase ${user.isBlocked ? 'text-[#ffb4ab]' : 'text-[#4ade80]'}`}>
                  {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60 mb-2">Role</Text>
              {isEditing ? (
                <View className="flex-row gap-2">
                  {['UTILISATEUR', 'PARTENAIRE', 'ADMINISTRATEUR'].map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setFormData({ ...formData, role: r })}
                      className={`px-3 py-2 rounded-sm border ${formData.role === r ? 'bg-[#c0c1ff]/20 border-[#c0c1ff]' : 'border-[#464554]/20'}`}
                    >
                      <Text className={`text-[10px] font-bold ${formData.role === r ? 'text-[#c0c1ff]' : 'text-[#908fa0]'}`}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text className="text-base font-medium text-[#c0c1ff]">{user.role}</Text>
              )}
            </View>
            <View>
              <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#908fa0]/60 mb-1">Registered</Text>
              <Text className="text-base font-medium text-[#e5e2e1]">
                {new Date(user.dateInscription).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Profile Form */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-[#1c1b1b] p-6 rounded-sm mb-6 border border-[#464554]/10">
          <Text className="text-lg font-medium text-[#e5e2e1] mb-4">Profile Information</Text>
          
          <View className="gap-4">
            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Prénom</Text>
              <TextInput
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
                editable={isEditing}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Nom</Text>
              <TextInput
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
                editable={isEditing}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">CIN</Text>
              <TextInput
                value={formData.cin}
                editable={false}
                className="bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] opacity-60"
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Téléphone</Text>
              <TextInput
                value={formData.telephone}
                onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                editable={isEditing}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Adresse</Text>
              <TextInput
                value={formData.adresseComplete}
                onChangeText={(text) => setFormData({ ...formData, adresseComplete: text })}
                editable={isEditing}
                multiline
                numberOfLines={2}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Ville</Text>
              <TextInput
                value={formData.ville}
                onChangeText={(text) => setFormData({ ...formData, ville: text })}
                editable={isEditing}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>

            <View>
              <Text className="text-xs text-[#908fa0] mb-2">Date de Naissance (YYYY-MM-DD)</Text>
              <TextInput
                value={formData.dateNaissance}
                onChangeText={(text) => setFormData({ ...formData, dateNaissance: text })}
                editable={isEditing}
                className={`bg-[#0e0e0e] border border-[#464554]/20 rounded-sm px-4 py-3 text-[#e5e2e1] ${!isEditing && 'opacity-60'}`}
                placeholderTextColor="#908fa0"
              />
            </View>
          </View>

          {isEditing && (
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    nom: user.profil?.nom || '',
                    prenom: user.profil?.prenom || '',
                    cin: user.profil?.cin || '',
                    telephone: user.telephone || '',
                    adresseComplete: user.profil?.adresseComplete || '',
                    ville: user.profil?.ville || '',
                    dateNaissance: user.profil?.dateNaissance ? new Date(user.profil.dateNaissance).toISOString().split('T')[0] : '',
                    role: user.role || '',
                  });
                }}
                className="flex-1 bg-[#353534] rounded-sm py-4 items-center"
              >
                <Text className="text-base font-bold text-[#e5e2e1]">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} className="flex-1 bg-[#8083ff] rounded-sm py-4 items-center">
                <Text className="text-base font-bold text-[#0d0096]">Save Changes</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Wallet Info */}
        {user.portefeuille && (
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-[#1c1b1b] p-6 rounded-sm mb-6 border border-[#464554]/10">
            <Text className="text-lg font-medium text-[#e5e2e1] mb-4">Wallet</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 bg-[#0e0e0e] p-4 rounded-sm">
                <Text className="text-xs text-[#908fa0] mb-1">Available</Text>
                <Text className="text-2xl font-light text-[#4ade80]">{user.portefeuille.soldeReel} MAD</Text>
              </View>
              <View className="flex-1 bg-[#0e0e0e] p-4 rounded-sm">
                <Text className="text-xs text-[#908fa0] mb-1">Blocked</Text>
                <Text className="text-2xl font-light text-[#ffb783]">{user.portefeuille.soldeBloque} MAD</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} className="bg-[#1c1b1b] p-6 rounded-sm border border-[#ffb4ab]/20">
          <Text className="text-lg font-medium text-[#ffb4ab] mb-4">Danger Zone</Text>
          <Pressable onPress={handleDelete} className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 rounded-sm py-4 items-center">
            <Text className="text-base font-bold text-[#ffb4ab]">Delete User</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
