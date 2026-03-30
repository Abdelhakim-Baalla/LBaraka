import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Modal, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';

// Ecran transactions avec reservations et QR codes
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState('');
  const [qrType, setQrType] = useState<'reception' | 'retour'>('reception');
  const [filter, setFilter] = useState<'ALL' | 'EMPRUNTS' | 'PRETS'>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  // Charger les transactions
  const loadTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getMyTransactions(token);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Rafraichir les donnees
  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // Generer QR reception
  const handleGenerateQRReception = async (transactionId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const data = await ApiService.getQRReception(token, transactionId);
      setQrData(data.qrCode || data.data || '');
      setQrType('reception');
      setShowQRModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de generer le QR');
    }
  };

  // Generer QR retour
  const handleGenerateQRRetour = async (transactionId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const data = await ApiService.getQRRetour(token, transactionId);
      setQrData(data.qrCode || data.data || '');
      setQrType('retour');
      setShowQRModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de generer le QR');
    }
  };

  // Finaliser le retour
  const handleFinalizeRetour = async (transactionId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await ApiService.finalizeRetour(token, transactionId);
      Alert.alert('Succes', 'Retour finalise, caution debloquee');
      setShowDetailModal(false);
      loadTransactions();
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de finaliser');
    }
  };

  // Signaler degradation
  const handleSignalerDegradation = async (transactionId: string) => {
    Alert.alert(
      'Signaler degradation',
      'Voulez-vous signaler une degradation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) return;

              await ApiService.signalerDegradation(token, transactionId);
              Alert.alert('Succes', 'Degradation signalee');
              setShowDetailModal(false);
              loadTransactions();
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Impossible de signaler');
            }
          }
        }
      ]
    );
  };

  // Formater la date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      EN_ATTENTE_RECEPTION: 'En attente reception',
      EN_COURS: 'En cours',
      EN_ATTENTE_RETOUR: 'En attente retour',
      TERMINEE: 'Terminee',
      ANNULEE: 'Annulee',
      DEGRADATION_SIGNALEE: 'Degradation signalee'
    };
    return labels[status] || status;
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    if (status === 'TERMINEE') return 'text-green-600';
    if (status === 'ANNULEE' || status === 'DEGRADATION_SIGNALEE') return 'text-red-600';
    if (status === 'EN_COURS') return 'text-blue-600';
    return 'text-amber-600';
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'EMPRUNTS') return t.type === 'EMPRUNT';
    if (filter === 'PRETS') return t.type === 'PRET';
    return true;
  });

  const empruntsCount = transactions.filter((t) => t.type === 'EMPRUNT').length;
  const pretsCount = transactions.filter((t) => t.type === 'PRET').length;

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 10 }}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="bg-white border border-outline-variant rounded-xl py-3 px-3 flex-row items-center gap-2 mb-3"
        >
          <Ionicons name="arrow-back" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Retour</Text>
        </Pressable>

        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-xs text-on-surface-variant font-semibold">Espace Echanges</Text>
              <Text className="text-base font-extrabold text-primary">Mes Transactions</Text>
            </View>
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Ionicons name="swap-horizontal-outline" size={20} color="#1B4332" />
            </View>
          </View>
          <Text className="text-xs text-on-surface-variant">
            Suivez vos reservations, remises et retours en un seul endroit.
          </Text>
        </View>

        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Total</Text>
            <Text className="text-sm font-bold text-primary mt-1">{transactions.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Emprunts</Text>
            <Text className="text-sm font-bold text-blue-600 mt-1">{empruntsCount}</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Prets</Text>
            <Text className="text-sm font-bold text-emerald-600 mt-1">{pretsCount}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-3">
          <Pressable
            onPress={() => setFilter('ALL')}
            className={`flex-1 py-2.5 rounded-xl ${filter === 'ALL' ? 'bg-primary' : 'bg-white border border-outline-variant'}`}
          >
            <Text className={`text-center text-xs font-bold ${filter === 'ALL' ? 'text-white' : 'text-on-surface-variant'}`}>
              Tout
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('EMPRUNTS')}
            className={`flex-1 py-2.5 rounded-xl ${filter === 'EMPRUNTS' ? 'bg-primary' : 'bg-white border border-outline-variant'}`}
          >
            <Text className={`text-center text-xs font-bold ${filter === 'EMPRUNTS' ? 'text-white' : 'text-on-surface-variant'}`}>
              Emprunts
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('PRETS')}
            className={`flex-1 py-2.5 rounded-xl ${filter === 'PRETS' ? 'bg-primary' : 'bg-white border border-outline-variant'}`}
          >
            <Text className={`text-center text-xs font-bold ${filter === 'PRETS' ? 'text-white' : 'text-on-surface-variant'}`}>
              Prets
            </Text>
          </Pressable>
        </View>

        {filteredTransactions.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 border border-outline-variant items-center">
            <Ionicons name="swap-horizontal-outline" size={32} color="#A5A6AA" />
            <Text className="text-sm text-on-surface-variant text-center mt-3">
              Aucune transaction pour le moment
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <Pressable
              key={transaction.id}
              onPress={() => {
                setSelectedTransaction(transaction);
                setShowDetailModal(true);
              }}
              className="bg-white rounded-2xl p-4 border border-outline-variant mb-3"
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                    {transaction.annonce?.titre || 'Annonce'}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-1">
                    {transaction.type === 'EMPRUNT' ? 'Vous empruntez' : 'Vous pretez'}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-lg ${transaction.type === 'EMPRUNT' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                  <Text className={`text-[10px] font-bold ${transaction.type === 'EMPRUNT' ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {transaction.type}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className={`text-xs font-semibold ${getStatusColor(transaction.statut)}`}>
                  {getStatusLabel(transaction.statut)}
                </Text>
                <Text className="text-xs text-on-surface-variant">
                  {formatDate(transaction.dateCreation)}
                </Text>
              </View>

              {transaction.montantCaution ? (
                <View className="mt-2 pt-2 border-t border-outline-variant/30">
                  <Text className="text-xs text-on-surface-variant">
                    Caution: {transaction.montantCaution} MAD
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Modal Detail Transaction */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24, maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-primary">Detail Transaction</Text>
              <Pressable onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#1B4332" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedTransaction ? (
                <>
                  <View className="bg-surface rounded-xl p-3 mb-3">
                    <Text className="text-xs text-on-surface-variant">Annonce</Text>
                    <Text className="text-sm font-bold text-primary mt-1">
                      {selectedTransaction.annonce?.titre || 'N/A'}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 bg-surface rounded-xl p-3">
                      <Text className="text-xs text-on-surface-variant">Type</Text>
                      <Text className="text-sm font-bold text-primary mt-1">
                        {selectedTransaction.type}
                      </Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-xl p-3">
                      <Text className="text-xs text-on-surface-variant">Statut</Text>
                      <Text className={`text-sm font-bold mt-1 ${getStatusColor(selectedTransaction.statut)}`}>
                        {getStatusLabel(selectedTransaction.statut)}
                      </Text>
                    </View>
                  </View>

                  {selectedTransaction.montantCaution ? (
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-amber-800">
                        Caution bloquee: {selectedTransaction.montantCaution} MAD
                      </Text>
                    </View>
                  ) : null}

                  <View className="bg-surface rounded-xl p-3 mb-3">
                    <Text className="text-xs text-on-surface-variant">Date creation</Text>
                    <Text className="text-sm font-semibold text-on-surface mt-1">
                      {formatDate(selectedTransaction.dateCreation)}
                    </Text>
                  </View>

                  {/* Actions selon le statut */}
                  {selectedTransaction.type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                    <Pressable
                      onPress={() => handleGenerateQRReception(selectedTransaction.id)}
                      className="bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Generer QR Remise</Text>
                    </Pressable>
                  ) : null}

                  {selectedTransaction.type === 'EMPRUNT' && selectedTransaction.statut === 'EN_COURS' ? (
                    <Pressable
                      onPress={() => handleGenerateQRRetour(selectedTransaction.id)}
                      className="bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Generer QR Retour</Text>
                    </Pressable>
                  ) : null}

                  {selectedTransaction.type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RETOUR' ? (
                    <Pressable
                      onPress={() => handleFinalizeRetour(selectedTransaction.id)}
                      className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Finaliser Retour</Text>
                    </Pressable>
                  ) : null}

                  {selectedTransaction.type === 'PRET' && selectedTransaction.statut === 'EN_COURS' ? (
                    <Pressable
                      onPress={() => handleSignalerDegradation(selectedTransaction.id)}
                      className="bg-red-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="alert-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Signaler Degradation</Text>
                    </Pressable>
                  ) : null}

                  {selectedTransaction.annonce?.id ? (
                    <Pressable
                      onPress={() => {
                        setShowDetailModal(false);
                        router.push(`/(annonces)/${selectedTransaction.annonce.id}`);
                      }}
                      className="bg-white border border-outline-variant rounded-xl py-3.5 items-center justify-center flex-row gap-2"
                    >
                      <Ionicons name="eye-outline" size={18} color="#1B4332" />
                      <Text className="text-primary font-bold">Voir Annonce</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal QR Code */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-primary">
                QR Code {qrType === 'reception' ? 'Remise' : 'Retour'}
              </Text>
              <Pressable onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#1B4332" />
              </Pressable>
            </View>

            {qrData ? (
              <View className="items-center">
                <Image
                  source={{ uri: qrData }}
                  style={{ width: 250, height: 250 }}
                  resizeMode="contain"
                />
                <Text className="text-xs text-on-surface-variant text-center mt-3">
                  {qrType === 'reception'
                    ? 'Montrez ce QR a l\'emprunteur pour valider la remise'
                    : 'Montrez ce QR au preteur pour valider le retour'}
                </Text>
              </View>
            ) : (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#1B4332" />
                <Text className="text-sm text-on-surface-variant mt-3">Chargement...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
