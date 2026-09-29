import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Avatar, EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { Segmented } from '../../components/ui/Segmented';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';

function roleTone(role?: string): 'primary' | 'gold' | 'info' | 'muted' {
  if (role === 'ADMINISTRATEUR') return 'primary';
  if (role === 'PARTENAIRE') return 'gold';
  if (role === 'UTILISATEUR') return 'info';
  return 'muted';
}

export default function AdminUserDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { c } = useTheme();
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
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={c.primary} />
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Chargement du profil...
          </T>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <Enter index={0}>
          <EmptyState
            icon="person-outline"
            title="Utilisateur non trouvé"
            body="Ce compte a peut-être été supprimé."
            action="Retour"
            onAction={() => router.back()}
          />
        </Enter>
      </Screen>
    );
  }

  const fullName = `${user.profil?.prenom || ''} ${user.profil?.nom || ''}`.trim();

  return (
    <Screen scroll>
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
            <T kind="h2" style={{ marginTop: 2 }}>Dossier utilisateur</T>
          </View>
          {!isEditing && (
            <PressableScale
              onPress={() => setIsEditing(true)}
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
              <Ionicons name="create-outline" size={20} color={c.primary} />
            </PressableScale>
          )}
        </View>
      </Enter>

      <Enter index={1}>
        <Card style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View>
              <Avatar name={fullName || user.email} size={60} />
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: user.isBlocked ? c.danger : c.success,
                  borderWidth: 2,
                  borderColor: c.surface,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <T kind="h3" numberOfLines={1}>{fullName || user.email}</T>
              <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                {user.email}
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <Tag label={user.isBlocked ? 'Bloqué' : 'Actif'} tone={user.isBlocked ? 'danger' : 'success'} />
                <Tag label={user.role} tone={roleTone(user.role)} />
              </View>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <T kind="caption" color={c.muted}>Rôle du compte</T>
            {isEditing ? (
              <View style={{ marginTop: 8 }}>
                <Segmented
                  options={[
                    { value: 'UTILISATEUR', label: 'Utilisateur' },
                    { value: 'PARTENAIRE', label: 'Partenaire' },
                    { value: 'ADMINISTRATEUR', label: 'Admin' },
                  ]}
                  value={formData.role}
                  onChange={(v) => setFormData({ ...formData, role: v })}
                />
              </View>
            ) : (
              <T kind="bodyStrong" color={c.primary} style={{ marginTop: 4 }}>{user.role}</T>
            )}
          </View>
          <T kind="small" color={c.muted} style={{ marginTop: 12 }}>
            Inscrit le {user.dateInscription ? new Date(user.dateInscription).toLocaleDateString('fr-FR') : 'N/A'}
          </T>
        </Card>
      </Enter>

      <Enter index={2}>
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Profil" />
          <Card style={{ marginTop: 12, gap: 16 }}>
            <TextField
              label="Prénom"
              icon="person-outline"
              value={formData.prenom}
              onChangeText={(text) => setFormData({ ...formData, prenom: text })}
              editable={isEditing}
            />
            <TextField
              label="Nom"
              icon="person-outline"
              value={formData.nom}
              onChangeText={(text) => setFormData({ ...formData, nom: text })}
              editable={isEditing}
            />
            <TextField
              label="CIN"
              icon="card-outline"
              value={formData.cin}
              editable={false}
            />
            <TextField
              label="Téléphone"
              icon="call-outline"
              value={formData.telephone}
              onChangeText={(text) => setFormData({ ...formData, telephone: text })}
              editable={isEditing}
              keyboardType="phone-pad"
            />
            <TextField
              label="Adresse"
              icon="home-outline"
              value={formData.adresseComplete}
              onChangeText={(text) => setFormData({ ...formData, adresseComplete: text })}
              editable={isEditing}
              multiline
              numberOfLines={2}
            />
            <TextField
              label="Ville"
              icon="location-outline"
              value={formData.ville}
              onChangeText={(text) => setFormData({ ...formData, ville: text })}
              editable={isEditing}
            />
            <TextField
              label="Date de naissance (AAAA-MM-JJ)"
              icon="calendar-outline"
              value={formData.dateNaissance}
              onChangeText={(text) => setFormData({ ...formData, dateNaissance: text })}
              editable={isEditing}
              placeholder="AAAA-MM-JJ"
            />
          </Card>
        </View>
      </Enter>

      {isEditing && (
        <Enter index={3}>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Annuler"
                variant="secondary"
                size="md"
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
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Enregistrer" size="md" icon="save-outline" onPress={handleSave} />
            </View>
          </View>
        </Enter>
      )}

      {user.portefeuille && (
        <Enter index={4}>
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Portefeuille" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <Card pad={16} style={{ flex: 1, backgroundColor: c.successSoft }}>
                <T kind="caption" color={c.onSuccessSoft}>Disponible</T>
                <T kind="h3" color={c.onSuccessSoft} style={{ marginTop: 6 }}>
                  {user.portefeuille.soldeReel} MAD
                </T>
              </Card>
              <Card pad={16} style={{ flex: 1, backgroundColor: c.goldSoft }}>
                <T kind="caption" color={c.onGoldSoft}>Bloqué</T>
                <T kind="h3" color={c.onGoldSoft} style={{ marginTop: 6 }}>
                  {user.portefeuille.soldeBloque} MAD
                </T>
              </Card>
            </View>
          </View>
        </Enter>
      )}

      <Enter index={5}>
        <Card style={{ marginTop: 24, marginBottom: 8, backgroundColor: c.dangerSoft }}>
          <T kind="h3" color={c.onDangerSoft}>Zone sensible</T>
          <T kind="small" color={c.onDangerSoft} style={{ marginTop: 4 }}>
            La suppression d&apos;un compte est définitive.
          </T>
          <View style={{ marginTop: 14 }}>
            <Button title="Supprimer l'utilisateur" variant="danger" icon="trash-outline" onPress={handleDelete} />
          </View>
        </Card>
      </Enter>
    </Screen>
  );
}
