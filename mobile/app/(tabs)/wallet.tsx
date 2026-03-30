import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';

// Ecran portefeuille avec solde et historique
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDepotModal, setShowDepotModal] = useState(false);
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [montant, setMontant] = useState('');
  const [montantRetrait, setMontantRetrait] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [errorRetrait, setErrorRetrait] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [])
  );

  // Charger le wallet
  const loadWallet = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getWallet(token);
      setWallet(data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Rafraichir les donnees
  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  // Deposer des fonds
  const handleDeposit = async () => {
    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      setError('Montant invalide');
      return;
    }

    setIsDepositing(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await ApiService.depositMoney(token, Number(montant));
      setShowDepotModal(false);
      setMontant('');
      Alert.alert('Succès', 'Dépôt effectué avec succès.');
      loadWallet();
    } catch (error: any) {
      setError(error?.message || 'Erreur lors du depot');
    } finally {
      setIsDepositing(false);
    }
  };

  // Retirer des fonds
  const handleRetrait = async () => {
    if (!montantRetrait || isNaN(Number(montantRetrait)) || Number(montantRetrait) <= 0) {
      setErrorRetrait('Montant invalide');
      return;
    }

    setIsWithdrawing(true);
    setErrorRetrait('');

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      await ApiService.withdrawMoney(token, Number(montantRetrait));
      setShowRetraitModal(false);
      setMontantRetrait('');
      Alert.alert('Succès', 'Retrait effectué avec succès.');
      loadWallet();
    } catch (error: any) {
      setErrorRetrait(error?.message || 'Erreur lors du retrait');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getMouvementLabel = (type: string) => {
    if (type === 'DEPOT') return 'Dépôt';
    if (type === 'RETRAIT') return 'Retrait';
    if (type === 'BLOCAGE') return 'Blocage caution';
    if (type === 'DEBLOCAGE') return 'Déblocage caution';
    return type;
  };

  const isPositiveMouvement = (type: string) => {
    return type === 'DEPOT' || type === 'DEBLOCAGE';
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
      >
        {/* Carte Solde */}
        <View className="bg-primary rounded-2xl p-4 mb-4">
          <Text className="text-white/80 text-xs font-semibold uppercase">Mon portefeuille</Text>
          <Text className="text-white text-2xl font-black mt-1">
            {wallet?.wallet?.soldeReel?.toFixed(2) || '0.00'} MAD
          </Text>
          <Text className="text-white/80 text-xs mt-1">
            Caution bloquée: {wallet?.wallet?.soldeBloque?.toFixed(2) || '0.00'} MAD
          </Text>
          <Text className="text-white/70 text-[11px] mt-2">
            Version démo: le dépôt est autorisé pour l'utilisateur connecté.
          </Text>
        </View>

        {/* Mini stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Devise</Text>
            <Text className="text-sm font-bold text-primary mt-1">{wallet?.wallet?.devise || 'MAD'}</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Mouvements</Text>
            <Text className="text-sm font-bold text-primary mt-1">{wallet?.mouvements?.length || 0}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 mb-3">
          <Pressable
            onPress={() => setShowDepotModal(true)}
            className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-down-circle-outline" size={18} color="#1B4332" />
              <Text className="text-on-surface font-semibold text-xs">Dépôt</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6c757d" />
          </Pressable>

          <Pressable
            onPress={() => setShowRetraitModal(true)}
            className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-up-circle-outline" size={18} color="#1B4332" />
              <Text className="text-on-surface font-semibold text-xs">Retrait</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6c757d" />
          </Pressable>
        </View>

        {/* Historique */}
        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
          <View className="flex-row items-center gap-3 mb-3">
            <Ionicons name="time-outline" size={20} color="#1B4332" />
            <Text className="text-on-surface font-semibold">Historique</Text>
          </View>

          {wallet?.mouvements && wallet.mouvements.length > 0 ? (
            wallet.mouvements.map((mouvement: any, index: number) => (
              <View
                key={mouvement.id || index}
                className="py-3 border-b border-outline-variant/30 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-on-surface">{getMouvementLabel(mouvement.type)}</Text>
                  <Text className="text-xs text-on-surface-variant mt-1">
                    {formatDate(mouvement.date)}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-bold ${
                    isPositiveMouvement(mouvement.type)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {isPositiveMouvement(mouvement.type) ? '+' : '-'}
                  {mouvement.montant?.toFixed(2)} MAD
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-on-surface-variant text-center py-4">
              Aucun mouvement pour le moment
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Modal Depot */}
      <Modal visible={showDepotModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-primary">Deposer des fonds</Text>
              <Pressable onPress={() => setShowDepotModal(false)}>
                <Ionicons name="close" size={24} color="#1B4332" />
              </Pressable>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="text-sm font-semibold text-on-surface mb-2">Montant (MAD)</Text>
              <TextInput
                value={montant}
                onChangeText={setMontant}
                placeholder="100"
                keyboardType="numeric"
                className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface"
              />
            </View>

            <Pressable
              onPress={handleDeposit}
              disabled={isDepositing}
              className="bg-primary rounded-xl py-3.5 items-center justify-center"
            >
              {isDepositing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Confirmer le depot</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Retrait */}
      <Modal visible={showRetraitModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-primary">Retirer des fonds</Text>
              <Pressable onPress={() => setShowRetraitModal(false)}>
                <Ionicons name="close" size={24} color="#1B4332" />
              </Pressable>
            </View>

            {errorRetrait ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-sm text-red-600">{errorRetrait}</Text>
              </View>
            ) : null}

            <View className="mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <Text className="text-[12px] text-amber-800">
                Solde disponible: {wallet?.wallet?.soldeReel?.toFixed(2) || '0.00'} MAD
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-on-surface mb-2">Montant (MAD)</Text>
              <TextInput
                value={montantRetrait}
                onChangeText={setMontantRetrait}
                placeholder="50"
                keyboardType="numeric"
                className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface"
              />
            </View>

            <Pressable
              onPress={handleRetrait}
              disabled={isWithdrawing}
              className="bg-primary rounded-xl py-3.5 items-center justify-center"
            >
              {isWithdrawing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Confirmer le retrait</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
