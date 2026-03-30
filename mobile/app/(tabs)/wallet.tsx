import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiService } from '../../services/api';

// Ecran portefeuille avec solde et historique
export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userPalier, setUserPalier] = useState('BRONZE');
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
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [])
  );

  // Charger le wallet
  const loadWallet = async () => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
      ]);

      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUserPoints(Number(user?.profil?.lBarakaScore || 0));
        setUserPalier(String(user?.profil?.palier || 'BRONZE'));
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

      const amount = Number(montant);

      await ApiService.depositMoney(token, amount);
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

  const handleExportCsv = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.exportWalletCsv(token);
      const fileName = String(data?.fileName || `wallet-export-${Date.now()}.csv`);
      const csvText = String(data?.csv || 'id,type,montant,date');
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('✅ Fichier sauvegardé', `${fileName}\n\nChemins: Documents de votre appareil`);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible d\'exporter le CSV');
    }
  };

  const handleShowReceipt = async (mouvementId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const data = await ApiService.getWalletMouvementReceiptPdf(token, mouvementId);
      const base64 = String(data?.base64 || '');

      if (!base64) {
        Alert.alert('Info', 'Reçu PDF introuvable.');
        return;
      }

      const fileName = String(data?.fileName || `recu-wallet-${Date.now()}.pdf`);
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('📄 PDF généré', `${fileName}\\n\\nChemins: Documents de votre appareil`);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de charger le reçu');
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

  const getMouvementIcon = (type: string) => {
    if (type === 'DEPOT') return 'arrow-down-circle-outline';
    if (type === 'RETRAIT') return 'arrow-up-circle-outline';
    if (type === 'BLOCAGE') return 'lock-closed-outline';
    if (type === 'DEBLOCAGE') return 'lock-open-outline';
    return 'swap-horizontal-outline';
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

  const soldeReel = Number(wallet?.wallet?.soldeReel || 0);
  const soldeBloque = Number(wallet?.wallet?.soldeBloque || 0);
  const mouvements = Array.isArray(wallet?.mouvements) ? wallet.mouvements : [];
  const mouvementsCredit = mouvements.filter((item: any) => isPositiveMouvement(item.type)).length;
  const mouvementsDebit = mouvements.filter((item: any) => !isPositiveMouvement(item.type)).length;
  const totalMouvements = mouvements.length;

  const filteredMouvements = mouvements.filter((item: any) => {
    // Filtre par type (ALL, CREDIT, DEBIT)
    if (historyFilter === 'ALL') {
      // continue
    } else if (historyFilter === 'CREDIT') {
      if (!isPositiveMouvement(item.type)) return false;
    } else if (historyFilter === 'DEBIT') {
      if (isPositiveMouvement(item.type)) return false;
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      const itemDate = new Date(item.date);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }
    }

    return true;
  });

  const ratioBloque = soldeReel + soldeBloque > 0
    ? Math.round((soldeBloque / (soldeReel + soldeBloque)) * 100)
    : 0;

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
              <Text className="text-xs text-on-surface-variant font-semibold">Espace Finance</Text>
              <Text className="text-base font-extrabold text-primary">Portefeuille Solidaire</Text>
            </View>
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Ionicons name="wallet-outline" size={20} color="#1B4332" />
            </View>
          </View>
          <Text className="text-xs text-on-surface-variant">
            Démo simple: dépôt et retrait direct utilisateur. En production, paiement externe recommandé.
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-extrabold text-primary">Comprendre vos valeurs</Text>
            <Ionicons name="help-circle-outline" size={18} color="#1B4332" />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-primary/10 rounded-xl p-3">
              <Text className="text-[11px] text-on-surface-variant">Points LBaraka</Text>
              <Text className="text-base font-bold text-primary mt-1">{userPoints} pts</Text>
              <Text className="text-[10px] text-on-surface-variant mt-1">Palier: {userPalier}</Text>
            </View>
            <View className="flex-1 bg-emerald-50 rounded-xl p-3">
              <Text className="text-[11px] text-on-surface-variant">Argent wallet</Text>
              <Text className="text-base font-bold text-emerald-700 mt-1">{soldeReel.toFixed(2)} MAD</Text>
              <Text className="text-[10px] text-on-surface-variant mt-1">Caution: {soldeBloque.toFixed(2)} MAD</Text>
            </View>
          </View>

          <Text className="text-xs text-on-surface-variant mt-3">
            Les points et l'argent sont différents: les points mesurent votre impact/réputation, le wallet MAD sert aux cautions et paiements.
          </Text>
        </View>

        {/* Carte Solde Hero */}
        <ImageBackground
          source={{ uri: 'https://images.pexels.com/photos/10531120/pexels-photo-10531120.jpeg' }}
          resizeMode="cover"
          style={{
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
            minHeight: 150,
          }}
          imageStyle={{ borderRadius: 16 }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(27, 67, 50, 0.32)',
            }}
          />

          <View style={{ padding: 16 }}>
            <Text className="text-white/80 text-xs font-semibold uppercase">Solde principal</Text>
            <Text className="text-white text-3xl font-black mt-1">{soldeReel.toFixed(2)} MAD</Text>
            <Text className="text-white/80 text-xs mt-1">Caution bloquée: {soldeBloque.toFixed(2)} MAD</Text>

            <View className="mt-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] text-white/85">Part du solde bloqué</Text>
                <Text className="text-[11px] text-white font-bold">{ratioBloque}%</Text>
              </View>
              <View className="h-2 rounded-full bg-white/25 overflow-hidden">
                <View className="h-2 rounded-full bg-white" style={{ width: `${ratioBloque}%` }} />
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Mini stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Devise</Text>
            <Text className="text-sm font-bold text-primary mt-1">{wallet?.wallet?.devise || 'MAD'}</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Mouvements</Text>
            <Text className="text-sm font-bold text-primary mt-1">{totalMouvements}</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-outline-variant">
            <Text className="text-[11px] text-on-surface-variant">Crédits</Text>
            <Text className="text-sm font-bold text-emerald-700 mt-1">{mouvementsCredit}</Text>
          </View>
        </View>

        {/* Actions rapides */}
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

          <Pressable
            onPress={() => router.push('/(tabs)/transactions')}
            className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={18} color="#1B4332" />
              <Text className="text-on-surface font-semibold text-xs">Transactions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6c757d" />
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-extrabold text-primary">Synthèse rapide</Text>
            <Ionicons name="stats-chart-outline" size={18} color="#1B4332" />
          </View>
          <Text className="text-xs text-on-surface-variant">
            Débits: {mouvementsDebit} • Crédits: {mouvementsCredit} • Opérations totales: {totalMouvements}
          </Text>
          <Text className="text-xs text-on-surface-variant mt-1">
            Conseil: gardez un petit solde libre pour réserver plus vite les annonces utiles.
          </Text>
        </View>

        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle-outline" size={18} color="#b45309" />
            <Text className="text-sm font-bold text-amber-800">Règles simples du wallet</Text>
          </View>
          <Text className="text-xs text-amber-800">1. Dépôt: ajoute du solde réel immédiatement.</Text>
          <Text className="text-xs text-amber-800 mt-1">2. Blocage caution: réservé automatiquement pendant une transaction.</Text>
          <Text className="text-xs text-amber-800 mt-1">3. Déblocage: la caution revient après validation du retour.</Text>
        </View>

        <Pressable
          onPress={handleExportCsv}
          className="bg-white border border-outline-variant rounded-xl py-3.5 px-4 flex-row items-center justify-center gap-2 mb-3"
        >
          <Ionicons name="download-outline" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">Exporter mes mouvements (CSV)</Text>
        </Pressable>

        {/* Filtres avancés */}
        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
          <Text className="text-sm font-semibold text-on-surface mb-3">Filtrer par date</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="Du (YYYY-MM-DD)"
              className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface"
            />
            <TextInput
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="Au (YYYY-MM-DD)"
              className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface"
            />
          </View>
        </View>

        {/* Historique */}
        <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="time-outline" size={20} color="#1B4332" />
              <Text className="text-on-surface font-semibold">Historique</Text>
            </View>
            <View className="flex-row gap-1">
              <Pressable
                onPress={() => setHistoryFilter('ALL')}
                className={`px-2 py-1 rounded-lg ${historyFilter === 'ALL' ? 'bg-primary' : 'bg-surface-container'}`}
              >
                <Text className={`text-[10px] font-bold ${historyFilter === 'ALL' ? 'text-white' : 'text-on-surface-variant'}`}>Tout</Text>
              </Pressable>
              <Pressable
                onPress={() => setHistoryFilter('CREDIT')}
                className={`px-2 py-1 rounded-lg ${historyFilter === 'CREDIT' ? 'bg-primary' : 'bg-surface-container'}`}
              >
                <Text className={`text-[10px] font-bold ${historyFilter === 'CREDIT' ? 'text-white' : 'text-on-surface-variant'}`}>Crédit</Text>
              </Pressable>
              <Pressable
                onPress={() => setHistoryFilter('DEBIT')}
                className={`px-2 py-1 rounded-lg ${historyFilter === 'DEBIT' ? 'bg-primary' : 'bg-surface-container'}`}
              >
                <Text className={`text-[10px] font-bold ${historyFilter === 'DEBIT' ? 'text-white' : 'text-on-surface-variant'}`}>Débit</Text>
              </Pressable>
            </View>
          </View>

          {filteredMouvements.length > 0 ? (
            filteredMouvements.map((mouvement: any, index: number) => (
              <View key={mouvement.id || index} className="py-3 border-b border-outline-variant/30">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-start gap-2">
                    <Ionicons name={getMouvementIcon(mouvement.type)} size={16} color="#1B4332" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-on-surface">{getMouvementLabel(mouvement.type)}</Text>
                      <Text className="text-xs text-on-surface-variant mt-1">
                        {formatDate(mouvement.date)}
                      </Text>
                    </View>
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

                <View className="flex-row justify-end mt-2">
                  <Pressable
                    onPress={() => handleShowReceipt(String(mouvement.id))}
                    className="bg-primary/10 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-primary text-[11px] font-bold">Voir reçu</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center py-5">
              <Ionicons name="wallet-outline" size={24} color="#A5A6AA" />
              <Text className="text-sm text-on-surface-variant text-center mt-2">Aucun mouvement pour ce filtre</Text>
            </View>
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
