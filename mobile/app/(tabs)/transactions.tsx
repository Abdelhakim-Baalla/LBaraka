import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Modal, Image, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ApiService } from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamily, radius, shadowMd, shadowSm } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { T } from '../../components/ui/T';
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Avatar, EmptyState, SectionHeader } from '../../components/ui/Primitives';
import { PressableScale } from '../../components/ui/PressableScale';
import { Enter } from '../../components/ui/Enter';
import { Segmented } from '../../components/ui/Segmented';

type Filter = 'ALL' | 'EMPRUNTS' | 'PRETS';

// Ecran transactions avec reservations et QR codes
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { c, mode } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState('');
  const [qrRawCode, setQrRawCode] = useState('');
  const [qrType, setQrType] = useState<'reception' | 'retour'>('reception');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState<'reception' | 'retour'>('reception');
  const [validationCode, setValidationCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [filter, setFilter] = useState<Filter>('ALL');
  // Pour surveiller le statut précédent
  const prevStatusRef = useRef<string | null>(null);
  const [statusAutoUpdated, setStatusAutoUpdated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();

      return () => {
        // Nettoyage forcé pour éviter un overlay invisible bloquant sur Android
        setShowDetailModal(false);
        setShowQRModal(false);
        setShowValidationModal(false);
        setIsScannerActive(false);
        setScanLocked(false);
      };
    }, [])
  );

  // Télécharger et ouvrir le PDF
  const handleDownloadPdf = async (transactionId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      // Récupérer l'URL de l'API depuis les variables d'environnement
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        Alert.alert('Erreur', 'URL de l\'API non configurée');
        return;
      }

      Alert.alert('Téléchargement', 'Téléchargement du contrat en cours...');

      const url = `${apiUrl}/contrats/${transactionId}/pdf`;
      const fileUri = FileSystem.documentDirectory + `contrat-${transactionId}.pdf`;

      console.log('Downloading from:', url);

      const downloadResult = await FileSystem.downloadAsync(
        url,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Download result:', downloadResult);

      if (downloadResult.status === 200) {
        Alert.alert('Succès', 'Contrat téléchargé !', [
          {
            text: 'Ouvrir',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(downloadResult.uri);
              } else {
                Alert.alert('Info', 'Fichier sauvegardé: ' + downloadResult.uri);
              }
            },
          },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Erreur', `Impossible de télécharger le PDF (status: ${downloadResult.status})`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Erreur', error?.message || 'Erreur lors du téléchargement');
    }
  };

  // Charger les transactions
  const loadTransactions = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent && isLoading === false) {
        setRefreshing(true);
      }

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
        const safeUserId =
          user?.id ||
          user?.utilisateur?.id ||
          user?.user?.id ||
          user?.utilisateurId ||
          '';
        const safeUserEmail =
          user?.email ||
          user?.utilisateur?.email ||
          user?.user?.email ||
          '';
        setCurrentUserId(String(safeUserId));
        setCurrentUserEmail(String(safeUserEmail));
      }

      const data = await ApiService.getMyTransactions(token);
      const nextTransactions = data.transactions || [];
      setTransactions(nextTransactions);

      if (selectedTransaction?.id) {
        const updatedSelected = nextTransactions.find((t: any) => t.id === selectedTransaction.id);
        if (updatedSelected) {
          setSelectedTransaction(updatedSelected);
        }
      }

      return nextTransactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-sync du statut quand le détail est ouvert (évite refresh manuel)
  useEffect(() => {
    if (!showDetailModal || !selectedTransaction?.id) {
      prevStatusRef.current = null;
      setStatusAutoUpdated(false);
      return;
    }

    prevStatusRef.current = selectedTransaction.statut;

    const intervalId = setInterval(async () => {
      const nextList = await loadTransactions({ silent: true });
      const refreshed = nextList.find((t: any) => t.id === selectedTransaction.id);
      if (refreshed) {
        // Si le statut a changé, on ferme tout et badge
        if (prevStatusRef.current && refreshed.statut !== prevStatusRef.current) {
          setShowDetailModal(false);
          setShowQRModal(false);
          setShowValidationModal(false);
          setIsScannerActive(false);
          setScanLocked(false);
          setStatusAutoUpdated(true);
          setTimeout(() => setStatusAutoUpdated(false), 3500); // Badge visible 3.5s
        }
        setSelectedTransaction(refreshed);
        prevStatusRef.current = refreshed.statut;
      }
    }, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [showDetailModal, selectedTransaction?.id]);

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
      setQrData(data.qrCode || '');
      setQrRawCode(data.code || '');
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
      setQrData(data.qrCode || '');
      setQrRawCode(data.code || '');
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

  // Annuler une reservation
  const handleAnnulerReservation = async (transactionId: string) => {
    Alert.alert(
      'Annuler reservation',
      'Voulez-vous annuler cette reservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) return;

              await ApiService.annulerReservation(token, transactionId);
              Alert.alert('Succes', 'Reservation annulee');
              setShowDetailModal(false);
              loadTransactions();
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Impossible d\'annuler');
            }
          }
        }
      ]
    );
  };

  const openValidationModal = (type: 'reception' | 'retour') => {
    setValidationType(type);
    setValidationCode('');
    // Evite les modals empilées qui peuvent bloquer les interactions sur Android
    setShowDetailModal(false);
    setShowValidationModal(true);
  };

  const closeValidationFlow = () => {
    setIsScannerActive(false);
    setShowValidationModal(false);
    setScanLocked(false);
  };

  const openCameraScanner = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Permission requise', 'Activez la caméra pour scanner le code QR.');
          return;
        }
      }

      setScanLocked(false);
      setIsScannerActive(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra.');
    }
  };

  const handleBarcodeScanned = (event: any) => {
    if (scanLocked) {
      return;
    }

    setScanLocked(true);
    const scannedValue = String(event?.data || '').trim();
    setValidationCode(scannedValue);
    setIsScannerActive(false);
    Alert.alert('Scan réussi', 'Code QR ajouté automatiquement.');
  };

  const handleCopyQrCode = async () => {
    if (!qrRawCode) {
      Alert.alert('Info', 'Aucun code brut disponible.');
      return;
    }

    await Clipboard.setStringAsync(qrRawCode);
    Alert.alert('Copié', 'Le code QR brut est copié. Vous pouvez le coller sur l\'autre appareil.');
  };

  const handleValidateQr = async () => {
    if (!selectedTransaction?.id) {
      Alert.alert('Erreur', 'Transaction introuvable');
      return;
    }

    if (!validationCode.trim()) {
      Alert.alert('Erreur', 'Code QR requis');
      return;
    }

    try {
      setIsValidating(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      let codeToValidate = validationCode.trim();

      if (validationType === 'retour') {
        try {
          const parsed = JSON.parse(codeToValidate);
          if (parsed?.secret && typeof parsed.secret === 'string') {
            codeToValidate = parsed.secret;
          }
        } catch {
          // Le code peut déjà être un secret brut
        }
      }

      if (validationType === 'reception') {
        await ApiService.validateReception(token, selectedTransaction.id, codeToValidate);
      } else {
        await ApiService.validateRetour(token, selectedTransaction.id, codeToValidate);
      }

      const validatedTransactionId = selectedTransaction.id;
      closeValidationFlow();
      setValidationCode('');
      Alert.alert('Succes', validationType === 'reception' ? 'Remise validée' : 'Retour confirmé');
      const refreshedList = await loadTransactions({ silent: true });
      const refreshed = refreshedList.find((t: any) => t.id === validatedTransactionId);
      if (refreshed) {
        setSelectedTransaction(refreshed);
      }
      setShowDetailModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Validation impossible');
    } finally {
      setIsValidating(false);
    }
  };

  // Formater la date
  const formatDate = (date?: string) => {
    if (!date) {
      return 'Date non disponible';
    }

    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date?: string) => {
    if (!date) {
      return 'Date non disponible';
    }

    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
      LITIGE_DEGRADATION: 'Litige degradation'
    };
    return labels[status] || status;
  };

  // Ton du badge de statut (design system)
  const getStatusTone = (status: string): 'primary' | 'gold' | 'success' | 'danger' | 'info' | 'muted' => {
    if (status === 'TERMINEE') return 'success';
    if (status === 'ANNULEE' || status === 'LITIGE_DEGRADATION') return 'danger';
    if (status === 'EN_COURS') return 'info';
    return 'gold';
  };

  // Couleur du rail de statut (meme mapping que le badge)
  const getStatusRailColor = (status: string) => {
    const tone = getStatusTone(status);
    if (tone === 'success') return c.success;
    if (tone === 'danger') return c.danger;
    if (tone === 'info') return c.info;
    if (tone === 'primary') return c.primary;
    if (tone === 'muted') return c.muted;
    return c.gold;
  };

  // Type de transaction selon l'utilisateur connecté
  const getTransactionType = (transaction: any): 'EMPRUNT' | 'PRET' => {
    if (currentUserId && transaction?.emprunteurId === currentUserId) {
      return 'EMPRUNT';
    }

    if (currentUserId && transaction?.preteurId === currentUserId) {
      return 'PRET';
    }

    if (currentUserEmail && transaction?.emprunteur?.email === currentUserEmail) {
      return 'EMPRUNT';
    }

    if (currentUserEmail && transaction?.preteur?.email === currentUserEmail) {
      return 'PRET';
    }

    return 'PRET';
  };

  // Date principale d'affichage
  const getTransactionDate = (transaction: any): string | undefined => {
    if (transaction?.dateDebut) return transaction.dateDebut;
    if (transaction?.dateFinReelle) return transaction.dateFinReelle;
    if (transaction?.annonce?.dateCreation) return transaction.annonce.dateCreation;
    return undefined;
  };

  const getTransactionCaution = (transaction: any): number => {
    return Number(transaction?.montantCautionBloquee || 0);
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter((t) => {
    const type = getTransactionType(t);

    if (filter === 'ALL') return true;
    if (filter === 'EMPRUNTS') return type === 'EMPRUNT';
    if (filter === 'PRETS') return type === 'PRET';
    return true;
  });

  const empruntsCount = transactions.filter((t) => getTransactionType(t) === 'EMPRUNT').length;
  const pretsCount = transactions.filter((t) => getTransactionType(t) === 'PRET').length;

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
      <View style={{ flex: 1, gap: 14, paddingTop: 8 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
            <Ionicons name="arrow-back" size={18} color={c.ink2} />
          </PressableScale>
          <View style={{ flex: 1 }}>
            <T kind="overline" color={c.muted}>
              Espace Echanges
            </T>
            <T kind="h1" style={{ marginTop: 2 }}>
              Mes Transactions
            </T>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: c.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="swap-horizontal-outline" size={22} color={c.primary} />
          </View>
        </View>

        <T kind="small" color={c.muted}>
          Suivez vos reservations, remises et retours en un seul endroit.
        </T>

        {/* Compteurs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Card pad={14} style={{ flex: 1 }}>
            <T kind="caption" color={c.muted}>
              Total
            </T>
            <T kind="h2" style={{ marginTop: 4 }}>
              {transactions.length}
            </T>
          </Card>
          <Card pad={14} style={{ flex: 1 }}>
            <T kind="caption" color={c.muted}>
              Emprunts
            </T>
            <T kind="h2" color={c.info} style={{ marginTop: 4 }}>
              {empruntsCount}
            </T>
          </Card>
          <Card pad={14} style={{ flex: 1 }}>
            <T kind="caption" color={c.muted}>
              Prets
            </T>
            <T kind="h2" color={c.success} style={{ marginTop: 4 }}>
              {pretsCount}
            </T>
          </Card>
        </View>

        {/* Filtres */}
        <Segmented<Filter>
          options={[
            { value: 'ALL', label: 'Tout' },
            { value: 'EMPRUNTS', label: 'Emprunts' },
            { value: 'PRETS', label: 'Prets' },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />

        {/* Liste */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
        >
          {statusAutoUpdated && (
            <View style={{ backgroundColor: c.successSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' }}>
              <T kind="small" color={c.onSuccessSoft}>
                Statut mis à jour automatiquement
              </T>
            </View>
          )}

          {filteredTransactions.length === 0 ? (
            <Card>
              <EmptyState
                icon="swap-horizontal-outline"
                title="Aucune transaction pour le moment"
                body="Vos reservations et echanges apparaîtront ici."
              />
            </Card>
          ) : (
            filteredTransactions.map((transaction, i) => {
              const type = getTransactionType(transaction);
              const caution = getTransactionCaution(transaction);
              const dateValue = getTransactionDate(transaction);

              return (
                <Enter key={transaction.id} index={Math.min(i, 6)}>
                  <PressableScale
                    onPress={() => {
                      setSelectedTransaction(transaction);
                      setShowDetailModal(true);
                    }}
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      flexDirection: 'row',
                      ...shadowSm(mode),
                    }}
                  >
                    <View style={{ width: 5, backgroundColor: getStatusRailColor(transaction.statut) }} />
                    <View style={{ flex: 1, padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <T kind="bodyStrong" numberOfLines={1}>
                            {transaction.annonce?.titre || 'Annonce'}
                          </T>
                          <T kind="small" color={c.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                            {type === 'EMPRUNT' ? 'Vous empruntez' : 'Vous pretez'} · {formatShortDate(dateValue)}
                          </T>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={c.muted} />
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                        <Tag label={getStatusLabel(transaction.statut)} tone={getStatusTone(transaction.statut)} />
                        {caution > 0 ? (
                          <Tag label={`Caution ${caution.toFixed(2)} MAD`} tone="gold" />
                        ) : null}
                      </View>
                    </View>
                  </PressableScale>
                </Enter>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Modal Détail Transaction */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: 20,
              paddingBottom: insets.bottom + 24,
              maxHeight: '90%',
              overflow: 'hidden',
              ...shadowMd(mode),
            }}
          >
            {selectedTransaction ? (
              <View
                style={{
                  height: 5,
                  borderRadius: radius.pill,
                  backgroundColor: getStatusRailColor(selectedTransaction.statut),
                  marginBottom: 14,
                }}
              />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T kind="h2">Détail de la transaction</T>
              <PressableScale
                onPress={() => setShowDetailModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.md,
                  backgroundColor: c.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={22} color={c.ink2} />
              </PressableScale>
            </View>
            {/* Badge de mise à jour auto */}
            {statusAutoUpdated && (
              <View style={{ marginBottom: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: c.successSoft, borderRadius: radius.md, alignItems: 'center' }}>
                <T kind="small" color={c.onSuccessSoft}>
                  Statut mis à jour automatiquement
                </T>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {selectedTransaction ? (
                <>

                  {(() => {
                    const type = getTransactionType(selectedTransaction);
                    const caution = getTransactionCaution(selectedTransaction);
                    const annonce = selectedTransaction.annonce || {};
                    const emprunteur = selectedTransaction.emprunteur || {};
                    const preteur = selectedTransaction.preteur || {};
                    const pointRelais = selectedTransaction.pointRelais || null;
                    const contrat = selectedTransaction.contrat || null;
                    const otherUser = type === 'EMPRUNT' ? preteur : emprunteur;

                    return (
                      <>
                        {/* PHOTO PRINCIPALE */}
                        {annonce.photos && annonce.photos.length > 0 ? (
                          <Image
                            source={{ uri: annonce.photos[0] }}
                            style={{ width: '100%', height: 170, borderRadius: radius.lg, marginBottom: 12 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ width: '100%', height: 170, borderRadius: radius.lg, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Ionicons name="image-outline" size={48} color={c.muted} />
                          </View>
                        )}

                        {/* INFOS ANNONCE */}
                        <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                          <T kind="caption" color={c.muted}>
                            Annonce
                          </T>
                          <T kind="h3" style={{ marginTop: 4 }}>
                            {annonce.titre || 'N/A'}
                          </T>
                          {annonce.description ? (
                            <T kind="small" color={c.muted} numberOfLines={3} style={{ marginTop: 4 }}>
                              {annonce.description}
                            </T>
                          ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          {annonce.categorie ? (
                            <View style={{ flex: 1, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
                              <T kind="caption" color={c.muted}>
                                Catégorie
                              </T>
                              <T kind="small" style={{ marginTop: 4 }}>
                                {annonce.categorie}
                              </T>
                            </View>
                          ) : null}
                          {annonce.mode ? (
                            <View style={{ flex: 1, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
                              <T kind="caption" color={c.muted}>
                                Mode
                              </T>
                              <T kind="small" style={{ marginTop: 4 }}>
                                {annonce.mode}
                              </T>
                            </View>
                          ) : null}
                          {annonce.condition ? (
                            <View style={{ flex: 1, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
                              <T kind="caption" color={c.muted}>
                                État
                              </T>
                              <T kind="small" style={{ marginTop: 4 }}>
                                {annonce.condition}
                              </T>
                            </View>
                          ) : null}
                        </View>

                        {/* AUTRE UTILISATEUR */}
                        {otherUser && (otherUser.profil || otherUser.email) ? (
                          <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="caption" color={c.muted} style={{ marginBottom: 10 }}>
                              {type === 'EMPRUNT' ? 'Prêteur' : 'Emprunteur'}
                            </T>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              {otherUser.profil?.photoProfil ? (
                                <Image
                                  source={{ uri: otherUser.profil.photoProfil }}
                                  style={{ width: 44, height: 44, borderRadius: radius.pill }}
                                />
                              ) : (
                                <Avatar name={`${otherUser.profil?.prenom || ''} ${otherUser.profil?.nom || ''}`} size={44} />
                              )}
                              <View style={{ flex: 1 }}>
                                <T kind="bodyStrong">
                                  {otherUser.profil?.prenom || ''} {otherUser.profil?.nom || ''}
                                </T>
                                {otherUser.email ? (
                                  <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                                    {otherUser.email}
                                  </T>
                                ) : null}
                                {otherUser.profil?.lBarakaScore ? (
                                  <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                                    <Tag label={`Score: ${otherUser.profil.lBarakaScore} pts`} tone="gold" />
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          <View style={{ flex: 1, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
                            <T kind="caption" color={c.muted}>
                              Type
                            </T>
                            <T kind="bodyStrong" style={{ marginTop: 4 }}>
                              {type}
                            </T>
                          </View>
                          <View style={{ flex: 1, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
                            <T kind="caption" color={c.muted}>
                              Statut
                            </T>
                            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                              <Tag label={getStatusLabel(selectedTransaction.statut)} tone={getStatusTone(selectedTransaction.statut)} />
                            </View>
                          </View>
                        </View>

                        {/* Dates */}
                        {selectedTransaction.dateDebut || selectedTransaction.dateFinPrevue || selectedTransaction.dateFinReelle ? (
                          <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <SectionHeader title="Dates" />
                            <View style={{ gap: 4, marginTop: 8 }}>
                              {selectedTransaction.dateDebut ? (
                                <T kind="small">
                                  Debut: {formatDate(selectedTransaction.dateDebut)}
                                </T>
                              ) : null}
                              {selectedTransaction.dateFinPrevue ? (
                                <T kind="small">
                                  Fin prevue: {formatDate(selectedTransaction.dateFinPrevue)}
                                </T>
                              ) : null}
                              {selectedTransaction.dateFinReelle ? (
                                <T kind="small">
                                  Fin reelle: {formatDate(selectedTransaction.dateFinReelle)}
                                </T>
                              ) : null}
                            </View>
                          </View>
                        ) : null}

                        {/* Retard */}
                        {selectedTransaction.retard && selectedTransaction.retard > 0 ? (
                          <View style={{ backgroundColor: c.dangerSoft, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="bodyStrong" color={c.onDangerSoft}>
                              Retard: {selectedTransaction.retard} jour(s)
                            </T>
                          </View>
                        ) : null}

                        {/* Degats */}
                        {selectedTransaction.degats ? (
                          <View style={{ backgroundColor: c.dangerSoft, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="bodyStrong" color={c.onDangerSoft}>
                              Degradation signalee
                            </T>
                          </View>
                        ) : null}

                        {/* Point relais */}
                        {pointRelais ? (
                          <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="caption" color={c.muted} style={{ marginBottom: 6 }}>
                              Point Relais
                            </T>
                            <T kind="bodyStrong">{pointRelais.nom}</T>
                            {pointRelais.adresse ? (
                              <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                                {pointRelais.adresse}
                              </T>
                            ) : null}
                            {pointRelais.telephone ? (
                              <T kind="small" color={c.muted} style={{ marginTop: 2 }}>
                                Tel: {pointRelais.telephone}
                              </T>
                            ) : null}
                          </View>
                        ) : null}

                        {/* Contrat PDF */}
                        {contrat && (contrat.urlPdfBilingue || contrat.urlPdf) ? (
                          <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="caption" color={c.muted} style={{ marginBottom: 6 }}>
                              Contrat
                            </T>
                            <T kind="small">
                              Numero: {contrat.numContrat || '-'}
                            </T>
                            <View style={{ marginTop: 10 }}>
                              <Button
                                title="Télécharger le contrat PDF"
                                size="md"
                                onPress={() => handleDownloadPdf(selectedTransaction.id)}
                              />
                            </View>
                          </View>
                        ) : null}

                        {/* Scans */}
                        {(selectedTransaction.scannedReception || selectedTransaction.scannedRetour) ? (
                          <View style={{ backgroundColor: c.successSoft, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="bodyStrong" color={c.onSuccessSoft} style={{ marginBottom: 4 }}>
                              Validations
                            </T>
                            {selectedTransaction.scannedReception ? (
                              <T kind="small" color={c.onSuccessSoft}>
                                Reception validee
                              </T>
                            ) : null}
                            {selectedTransaction.scannedRetour ? (
                              <T kind="small" color={c.onSuccessSoft}>
                                Retour valide
                              </T>
                            ) : null}
                          </View>
                        ) : null}

                        {caution > 0 ? (
                          <View style={{ backgroundColor: c.goldSoft, borderRadius: radius.md, padding: 14, marginBottom: 10 }}>
                            <T kind="small" color={c.onGoldSoft}>
                              Caution bloquée : {caution.toFixed(2)} MAD
                            </T>
                          </View>
                        ) : null}

                        {/* Actions selon le statut */}
                        <View style={{ gap: 8, marginTop: 4 }}>
                          {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                            <Button
                              title="Generer QR Remise"
                              icon="qr-code-outline"
                              onPress={() => handleGenerateQRReception(selectedTransaction.id)}
                            />
                          ) : null}

                          {type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                            <Button
                              title="Valider Remise (scan)"
                              icon="checkmark-done-circle-outline"
                              onPress={() => openValidationModal('reception')}
                            />
                          ) : null}

                          {type === 'PRET' && selectedTransaction.statut === 'EN_COURS' ? (
                            <Button
                              title="Generer QR Retour"
                              icon="qr-code-outline"
                              onPress={() => handleGenerateQRRetour(selectedTransaction.id)}
                            />
                          ) : null}

                          {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_COURS' ? (
                            <Button
                              title="Confirmer Retour (scan)"
                              icon="checkmark-done-circle-outline"
                              onPress={() => openValidationModal('retour')}
                            />
                          ) : null}

                          {type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RETOUR' ? (
                            <Button
                              title="Finaliser Retour"
                              icon="checkmark-circle-outline"
                              onPress={() => handleFinalizeRetour(selectedTransaction.id)}
                            />
                          ) : null}

                          {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                            <Button
                              title="Annuler Reservation"
                              variant="danger"
                              icon="close-circle-outline"
                              onPress={() => handleAnnulerReservation(selectedTransaction.id)}
                            />
                          ) : null}

                          {type === 'PRET' && selectedTransaction.statut === 'TERMINEE' ? (
                            <Button
                              title="Signaler Degradation"
                              variant="danger"
                              icon="alert-circle-outline"
                              onPress={() => handleSignalerDegradation(selectedTransaction.id)}
                            />
                          ) : null}

                          {selectedTransaction.annonce?.id ? (
                            <>
                              <Button
                                title="Discuter"
                                variant="secondary"
                                icon="chatbubble-outline"
                                onPress={() => {
                                  const isEmprunteur = getTransactionType(selectedTransaction) === 'EMPRUNT';
                                  const otherId = isEmprunteur ? selectedTransaction.preteurId : selectedTransaction.emprunteurId;
                                  setShowDetailModal(false);

                                  // Attendre un peu pour que le modal se ferme
                                  setTimeout(() => {
                                    router.push(`/(tabs)/chat?openChat=${selectedTransaction.annonce.id}&otherId=${otherId}`);
                                  }, 300);
                                }}
                              />

                              <Button
                                title="Voir Annonce"
                                variant="secondary"
                                icon="eye-outline"
                                onPress={() => {
                                  setShowDetailModal(false);
                                  router.push(`/(annonces)/${selectedTransaction.annonce.id}`);
                                }}
                              />
                            </>
                          ) : null}
                        </View>
                      </>
                    );
                  })()}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal QR Code */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Card style={{ width: '100%', maxWidth: 380 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T kind="h2">
                QR Code {qrType === 'reception' ? 'Remise' : 'Retour'}
              </T>
              <PressableScale
                onPress={() => setShowQRModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.md,
                  backgroundColor: c.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={22} color={c.ink2} />
              </PressableScale>
            </View>

            {qrData ? (
              <View style={{ alignItems: 'center' }}>
                <Image
                  source={{ uri: qrData }}
                  style={{ width: 250, height: 250, borderRadius: radius.md }}
                  resizeMode="contain"
                />
                <T kind="small" color={c.muted} center style={{ marginTop: 12 }}>
                  {qrType === 'reception'
                    ? 'Montrez ce QR au preteur pour valider la remise'
                    : 'Montrez ce QR a l\'emprunteur pour valider le retour'}
                </T>

                {qrRawCode ? (
                  <>
                    <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                      <Button
                        title="Copier le code brut"
                        variant="secondary"
                        size="md"
                        onPress={handleCopyQrCode}
                      />
                    </View>
                    <T kind="caption" color={c.muted} center numberOfLines={3} style={{ marginTop: 12 }}>
                      {qrRawCode}
                    </T>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="alert-circle-outline" size={26} color={c.muted} />
                <T kind="small" color={c.muted} center style={{ marginTop: 12 }}>
                  QR image non disponible. Utilisez le code brut si affiché.
                </T>

                {qrRawCode ? (
                  <>
                    <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                      <Button
                        title="Copier le code brut"
                        variant="secondary"
                        size="md"
                        onPress={handleCopyQrCode}
                      />
                    </View>
                    <T kind="caption" color={c.muted} center numberOfLines={4} style={{ marginTop: 12 }}>
                      {qrRawCode}
                    </T>
                  </>
                ) : null}
              </View>
            )}
          </Card>
        </View>
      </Modal>

      {/* Modal Validation QR */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="slide"
        onRequestClose={closeValidationFlow}
      >
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: 20,
              paddingBottom: insets.bottom + 24,
              ...shadowMd(mode),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T kind="h2">
                {validationType === 'reception' ? 'Valider Remise' : 'Confirmer Retour'}
              </T>
              <PressableScale
                onPress={closeValidationFlow}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.md,
                  backgroundColor: c.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={22} color={c.ink2} />
              </PressableScale>
            </View>

            <T kind="overline" color={c.muted} style={{ marginBottom: 8 }}>
              Code QR scanné (ou token)
            </T>
            <View
              style={{
                backgroundColor: c.surface2,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: c.line,
                paddingHorizontal: 14,
                paddingVertical: 12,
                minHeight: 110,
              }}
            >
              <TextInput
                value={validationCode}
                onChangeText={setValidationCode}
                placeholder="Collez le code scanné ici"
                placeholderTextColor={c.muted}
                multiline
                textAlignVertical="top"
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: 15,
                  color: c.ink,
                  minHeight: 86,
                }}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                title="Scanner avec la caméra"
                variant="secondary"
                size="md"
                icon="scan-outline"
                onPress={openCameraScanner}
              />
            </View>

            {isScannerActive ? (
              <View style={{ marginTop: 12, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
                <View style={{ height: 260 }}>
                  <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                </View>

                <View style={{ padding: 12, backgroundColor: c.surface2 }}>
                  <T kind="small" color={c.muted} center>
                    Placez le QR dans le cadre pour scanner automatiquement.
                  </T>
                  <View style={{ marginTop: 8 }}>
                    <Button
                      title="Fermer le scanner"
                      variant="secondary"
                      size="md"
                      onPress={() => {
                        setIsScannerActive(false);
                        setScanLocked(false);
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 14 }}>
              <Button
                title="Valider"
                loading={isValidating}
                onPress={handleValidateQr}
              />
            </View>
          </View>
        </View>
      </Modal>

    </Screen>
  );
}
