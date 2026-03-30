import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';

// Ecran portefeuille avec solde et historique
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDepotModal, setShowDepotModal] = useState(false);
  const [montant, setMontant] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [])
  );

  // Charger le wallet
  const loadWallet = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

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
      loadWallet();
    } catch (error: any) {
      setError(error?.message || 'Erreur lors du depot');
    } finally {
      setIsDepositing(false);
    }
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
          <Text className="text-white/80 text-xs font-semibold uppercase">Solde disponible</Text>
          <Text className="text-white text-2xl font-black mt-1">
            {wallet?.soldeDisponible?.toFixed(2) || '0.00'} MAD
          </Text>
          <Text className="text-white/80 text-xs mt-1">
            Caution bloquee: {wallet?.cautionBloquee?.toFixed(2) || '0.00'} MAD
          </Text>
        </View>

        {/* Actions */}
        <Pressable
          onPress={() => setShowDepotModal(true)}
          className="bg-white rounded-2xl p-4 border border-outline-variant mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="arrow-down-circle-outline" size={20} color="#1B4332" />
            <Text className="text-on-surface font-semibold">Deposer des fonds</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </Pressable>

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
                  <Text className="text-sm font-semibold text-on-surface">{mouvement.type}</Text>
                  <Text className="text-xs text-on-surface-variant mt-1">
                    {formatDate(mouvement.dateCreation)}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-bold ${
                    mouvement.type === 'DEPOT' || mouvement.type === 'DEBLOCAGE'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {mouvement.type === 'DEPOT' || mouvement.type === 'DEBLOCAGE' ? '+' : '-'}
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
    </View>
  );
}
