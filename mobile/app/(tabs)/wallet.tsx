import React, { useState, useCallback } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiService } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadowSm, shadowMd } from '@/theme/tokens';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { T } from '@/components/ui/T';
import { SectionHeader, EmptyState } from '@/components/ui/Primitives';
import { PressableScale } from '@/components/ui/PressableScale';
import { Enter } from '@/components/ui/Enter';
import { Segmented } from '@/components/ui/Segmented';

export default function WalletScreen() {
  const { c, mode, dark } = useTheme();
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
  const [balanceVisible, setBalanceVisible] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [])
  );

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

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

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

      Alert.alert('Fichier sauvegardé', `${fileName}\n\nChemins: Documents de votre appareil`);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || "Impossible d'exporter le CSV");
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

      Alert.alert('PDF généré', `${fileName}\n\nChemins: Documents de votre appareil`);
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

  const getMouvementIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type === 'DEPOT') return 'arrow-down-circle-outline';
    if (type === 'RETRAIT') return 'arrow-up-circle-outline';
    if (type === 'BLOCAGE') return 'lock-closed-outline';
    if (type === 'DEBLOCAGE') return 'lock-open-outline';
    return 'swap-horizontal-outline';
  };

  const getMouvementTone = (type: string): 'success' | 'danger' | 'primary' | 'gold' | 'muted' => {
    if (type === 'DEPOT' || type === 'DEBLOCAGE') return 'success';
    if (type === 'RETRAIT') return 'danger';
    if (type === 'BLOCAGE') return 'gold';
    return 'muted';
  };

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
    if (historyFilter === 'ALL') {
    } else if (historyFilter === 'CREDIT') {
      if (!isPositiveMouvement(item.type)) return false;
    } else if (historyFilter === 'DEBIT') {
      if (isPositiveMouvement(item.type)) return false;
    }

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
      <Screen padBottom={108}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padBottom={108}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Enter index={0}>
          <View style={{ marginTop: 8 }}>
            <T kind="overline" color={c.muted}>
              Espace Finance
            </T>
            <T kind="h1" style={{ marginTop: 4 }}>
              Portefeuille Solidaire
            </T>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Tag label={`${userPoints} pts`} tone="gold" />
              <T kind="caption" color={c.muted}>
                {`Palier : ${userPalier}`}
              </T>
            </View>
          </View>
        </Enter>

        <Enter index={1}>
          <View
            style={{
              borderRadius: radius.xl,
              marginTop: 16,
              backgroundColor: dark ? c.ink : '#241811',
              padding: 20,
              overflow: 'hidden',
              ...shadowMd(mode),
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -70,
                right: -50,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: dark ? c.ink2 : '#E4703A',
                opacity: 0.16,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -90,
                left: -40,
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: dark ? c.ink2 : '#E4703A',
                opacity: 0.1,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T kind="overline" color={dark ? c.bg : '#E8B95C'}>
                Solde disponible
              </T>
              <View
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 7,
                  backgroundColor: dark ? c.bg : '#E8B95C',
                  opacity: 0.85,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <T kind="display" color={dark ? c.bg : '#F5EDE1'} style={{ flex: 1 }} numberOfLines={1}>
                {balanceVisible ? `${soldeReel.toFixed(2)} MAD` : '••••••'}
              </T>
              <PressableScale
                onPress={() => setBalanceVisible((v) => !v)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: dark ? 'rgba(21,17,16,0.08)' : 'rgba(245,237,225,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={dark ? c.bg : '#F5EDE1'}
                />
              </PressableScale>
            </View>
            <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T kind="small" color={dark ? c.bg : '#F5EDE1'} style={{ opacity: 0.85 }}>
                {`Caution bloquée ${soldeBloque.toFixed(2)} MAD`}
              </T>
              <T kind="caption" color={dark ? c.bg : '#F5EDE1'}>
                {`${ratioBloque}%`}
              </T>
            </View>
            <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(21,17,16,0.12)' : 'rgba(245,237,225,0.2)', overflow: 'hidden' }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? '#9A5B12' : '#E8B95C', width: `${ratioBloque}%` }} />
            </View>
          </View>
        </Enter>

        <Enter index={2}>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <PressableScale
              onPress={() => setShowDepotModal(true)}
              style={{
                flex: 1,
                height: 84,
                borderRadius: radius.lg,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                ...shadowSm(mode),
              }}
            >
              <Ionicons name="arrow-down-circle-outline" size={24} color={c.onPrimary} />
              <T kind="bodyStrong" color={c.onPrimary}>
                Dépôt
              </T>
            </PressableScale>
            <PressableScale
              onPress={() => setShowRetraitModal(true)}
              style={{
                flex: 1,
                height: 84,
                borderRadius: radius.lg,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                ...shadowSm(mode),
              }}
            >
              <Ionicons name="arrow-up-circle-outline" size={24} color={c.primary} />
              <T kind="bodyStrong">Retrait</T>
            </PressableScale>
            <PressableScale
              onPress={handleExportCsv}
              style={{
                flex: 1,
                height: 84,
                borderRadius: radius.lg,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                ...shadowSm(mode),
              }}
            >
              <Ionicons name="receipt-outline" size={24} color={c.primary} />
              <T kind="bodyStrong">Historique</T>
            </PressableScale>
          </View>
        </Enter>

        <Enter index={3}>
          <View
            style={{
              marginTop: 16,
              backgroundColor: c.surface2,
              borderRadius: radius.lg,
              flexDirection: 'row',
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <T kind="h3">{wallet?.wallet?.devise || 'MAD'}</T>
              <T kind="caption" color={c.muted}>
                Devise
              </T>
            </View>
            <View style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.line }}>
              <T kind="h3">{totalMouvements}</T>
              <T kind="caption" color={c.muted}>
                Mouvements
              </T>
            </View>
            <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <T kind="h3" color={c.success}>
                {mouvementsCredit}
              </T>
              <T kind="caption" color={c.muted}>
                Crédits
              </T>
            </View>
          </View>
        </Enter>

        <Enter index={4}>
          <View style={{ marginTop: 20 }}>
            <SectionHeader title="Historique" action="Transactions" onAction={() => router.push('/(tabs)/transactions')} />
            <View style={{ marginTop: 12 }}>
              <Segmented
                options={[
                  { value: 'ALL', label: 'Tout' },
                  { value: 'CREDIT', label: 'Crédit' },
                  { value: 'DEBIT', label: 'Débit' },
                ]}
                value={historyFilter}
                onChange={(v) => setHistoryFilter(v as typeof historyFilter)}
              />
            </View>
            <Card style={{ marginTop: 12, gap: 12 }}>
              <T kind="bodyStrong">Filtrer par date</T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Du"
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Au"
                    value={dateTo}
                    onChangeText={setDateTo}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </Card>

            <Card style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="time-outline" size={20} color={c.primary} />
                <T kind="h3">Mouvements</T>
              </View>
              <T kind="small" color={c.muted}>
                {`Débits : ${mouvementsDebit} - Crédits : ${mouvementsCredit} - Total : ${totalMouvements}`}
              </T>
              {filteredMouvements.length > 0 ? (
                filteredMouvements.map((mouvement: any, index: number) => (
                  <Enter key={mouvement.id || index} index={Math.min(index, 6)}>
                    <PressableScale onPress={() => handleShowReceipt(String(mouvement.id))}>
                      <View
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth: index === filteredMouvements.length - 1 ? 0 : 1,
                          borderBottomColor: c.line,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: radius.md,
                              backgroundColor: c.surface2,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name={getMouvementIcon(mouvement.type)} size={20} color={c.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <T kind="bodyStrong">{getMouvementLabel(mouvement.type)}</T>
                            <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                              {formatDate(mouvement.date)}
                            </T>
                          </View>
                          <T
                            kind="bodyStrong"
                            color={isPositiveMouvement(mouvement.type) ? c.success : c.danger}
                          >
                            {isPositiveMouvement(mouvement.type) ? '+' : '-'}
                            {mouvement.montant?.toFixed(2)} MAD
                          </T>
                          <Ionicons name="chevron-forward" size={18} color={c.muted} />
                        </View>
                        <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                          <Tag label={getMouvementLabel(mouvement.type)} tone={getMouvementTone(mouvement.type)} />
                        </View>
                      </View>
                    </PressableScale>
                  </Enter>
                ))
              ) : (
                <EmptyState
                  icon="wallet-outline"
                  title="Aucun mouvement pour ce filtre"
                  body="Ajustez le filtre ou la période pour voir plus de résultats."
                />
              )}
            </Card>
          </View>
        </Enter>
      </ScrollView>

      <Modal visible={showDepotModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <T kind="h2">Déposer des fonds</T>
              <Pressable onPress={() => setShowDepotModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={c.ink} />
              </Pressable>
            </View>

            {error ? (
              <View style={{ backgroundColor: c.dangerSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 }}>
                <T kind="bodyStrong" color={c.onDangerSoft}>{error}</T>
              </View>
            ) : null}

            <TextField
              label="Montant (MAD)"
              value={montant}
              onChangeText={setMontant}
              placeholder="100"
              keyboardType="numeric"
            />

            <View style={{ marginTop: 20 }}>
              <Button title="Confirmer le dépôt" loading={isDepositing} onPress={handleDeposit} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRetraitModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <T kind="h2">Retirer des fonds</T>
              <Pressable onPress={() => setShowRetraitModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={c.ink} />
              </Pressable>
            </View>

            {errorRetrait ? (
              <View style={{ backgroundColor: c.dangerSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 }}>
                <T kind="bodyStrong" color={c.onDangerSoft}>{errorRetrait}</T>
              </View>
            ) : null}

            <View style={{ backgroundColor: c.goldSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 }}>
              <T kind="small" color={c.onGoldSoft}>
                Solde disponible : {wallet?.wallet?.soldeReel?.toFixed(2) || '0.00'} MAD
              </T>
            </View>

            <TextField
              label="Montant (MAD)"
              value={montantRetrait}
              onChangeText={setMontantRetrait}
              placeholder="50"
              keyboardType="numeric"
            />

            <View style={{ marginTop: 20 }}>
              <Button title="Confirmer le retrait" loading={isWithdrawing} onPress={handleRetrait} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
