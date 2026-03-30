import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Modal, Image, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ApiService } from '../../services/api';

// Ecran transactions avec reservations et QR codes
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
  const [filter, setFilter] = useState<'ALL' | 'EMPRUNTS' | 'PRETS'>('ALL');
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

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    if (status === 'TERMINEE') return 'text-green-600';
    if (status === 'ANNULEE' || status === 'LITIGE_DEGRADATION') return 'text-red-600';
    if (status === 'EN_COURS') return 'text-blue-600';
    return 'text-amber-600';
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
          filteredTransactions.map((transaction) => {
            const type = getTransactionType(transaction);
            const caution = getTransactionCaution(transaction);
            const dateValue = getTransactionDate(transaction);

            return (
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
                      {type === 'EMPRUNT' ? 'Vous empruntez' : 'Vous pretez'}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-lg ${type === 'EMPRUNT' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                    <Text className={`text-[10px] font-bold ${type === 'EMPRUNT' ? 'text-blue-700' : 'text-emerald-700'}`}>
                      {type}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className={`text-xs font-semibold ${getStatusColor(transaction.statut)}`}>
                    {getStatusLabel(transaction.statut)}
                  </Text>
                  <Text className="text-xs text-on-surface-variant">
                    {formatDate(dateValue)}
                  </Text>
                </View>

                {caution > 0 ? (
                  <View className="mt-2 pt-2 border-t border-outline-variant/30">
                    <Text className="text-xs text-on-surface-variant">
                      Caution: {caution.toFixed(2)} MAD
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
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
            {/* Badge de mise à jour auto */}
            {statusAutoUpdated && (
              <View className="mb-2 px-3 py-2 bg-emerald-100 border border-emerald-300 rounded-xl items-center">
                <Text className="text-xs text-emerald-800 font-semibold">Statut mis à jour automatiquement</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedTransaction ? (
                <>

                  {(() => {
                    const type = getTransactionType(selectedTransaction);
                    const caution = getTransactionCaution(selectedTransaction);
                    const dateValue = getTransactionDate(selectedTransaction);
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
                            style={{ width: '100%', height: 170, borderRadius: 16, marginBottom: 12 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-[170px] rounded-xl bg-emerald-50 items-center justify-center mb-3">
                            <Ionicons name="image-outline" size={48} color="#A5A6AA" />
                          </View>
                        )}

                        {/* INFOS ANNONCE */}
                        <View className="bg-surface rounded-xl p-3 mb-3">
                          <Text className="text-xs text-on-surface-variant">Annonce</Text>
                          <Text className="text-base font-bold text-primary mt-1">
                            {annonce.titre || 'N/A'}
                          </Text>
                          {annonce.description ? (
                            <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={3}>
                              {annonce.description}
                            </Text>
                          ) : null}
                        </View>

                        <View className="flex-row gap-2 mb-3">
                          {annonce.categorie ? (
                            <View className="flex-1 bg-surface rounded-xl p-3">
                              <Text className="text-xs text-on-surface-variant">Catégorie</Text>
                              <Text className="text-xs font-bold text-primary mt-1">
                                {annonce.categorie}
                              </Text>
                            </View>
                          ) : null}
                          {annonce.mode ? (
                            <View className="flex-1 bg-surface rounded-xl p-3">
                              <Text className="text-xs text-on-surface-variant">Mode</Text>
                              <Text className="text-xs font-bold text-primary mt-1">
                                {annonce.mode}
                              </Text>
                            </View>
                          ) : null}
                          {annonce.condition ? (
                            <View className="flex-1 bg-surface rounded-xl p-3">
                              <Text className="text-xs text-on-surface-variant">État</Text>
                              <Text className="text-xs font-bold text-primary mt-1">
                                {annonce.condition}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* AUTRE UTILISATEUR */}
                        {otherUser && (otherUser.profil || otherUser.email) ? (
                          <View className="bg-surface rounded-xl p-3 mb-3">
                            <Text className="text-xs text-on-surface-variant mb-2">
                              {type === 'EMPRUNT' ? 'Prêteur' : 'Emprunteur'}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              {otherUser.profil?.photoProfil ? (
                                <Image
                                  source={{ uri: otherUser.profil.photoProfil }}
                                  style={{ width: 44, height: 44, borderRadius: 22 }}
                                />
                              ) : (
                                <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center">
                                  <Ionicons name="person-outline" size={22} color="#1B4332" />
                                </View>
                              )}
                              <View className="flex-1">
                                <Text className="text-sm font-bold text-primary">
                                  {otherUser.profil?.prenom || ''} {otherUser.profil?.nom || ''}
                                </Text>
                                {otherUser.email ? (
                                  <Text className="text-xs text-on-surface-variant mt-1">
                                    {otherUser.email}
                                  </Text>
                                ) : null}
                                {otherUser.profil?.lBarakaScore ? (
                                  <Text className="text-xs text-emerald-700 mt-1">
                                    Score: {otherUser.profil.lBarakaScore} pts
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        ) : null}

                  <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 bg-surface rounded-xl p-3">
                      <Text className="text-xs text-on-surface-variant">Type</Text>
                      <Text className="text-sm font-bold text-primary mt-1">
                        {type}
                      </Text>
                    </View>
                    <View className="flex-1 bg-surface rounded-xl p-3">
                      <Text className="text-xs text-on-surface-variant">Statut</Text>
                      <Text className={`text-sm font-bold mt-1 ${getStatusColor(selectedTransaction.statut)}`}>
                        {getStatusLabel(selectedTransaction.statut)}
                      </Text>
                    </View>
                  </View>

                  {/* Dates */}
                  {selectedTransaction.dateDebut || selectedTransaction.dateFinPrevue || selectedTransaction.dateFinReelle ? (
                    <View className="bg-surface rounded-xl p-3 mb-3">
                      <Text className="text-xs text-on-surface-variant mb-2">Dates</Text>
                      {selectedTransaction.dateDebut ? (
                        <Text className="text-xs text-on-surface mt-1">
                          Debut: {formatDate(selectedTransaction.dateDebut)}
                        </Text>
                      ) : null}
                      {selectedTransaction.dateFinPrevue ? (
                        <Text className="text-xs text-on-surface mt-1">
                          Fin prevue: {formatDate(selectedTransaction.dateFinPrevue)}
                        </Text>
                      ) : null}
                      {selectedTransaction.dateFinReelle ? (
                        <Text className="text-xs text-on-surface mt-1">
                          Fin reelle: {formatDate(selectedTransaction.dateFinReelle)}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Retard */}
                  {selectedTransaction.retard && selectedTransaction.retard > 0 ? (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-red-800 font-bold">
                        Retard: {selectedTransaction.retard} jour(s)
                      </Text>
                    </View>
                  ) : null}

                  {/* Degats */}
                  {selectedTransaction.degats ? (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-red-800 font-bold">
                        Degradation signalee
                      </Text>
                    </View>
                  ) : null}

                  {/* Point relais */}
                  {pointRelais ? (
                    <View className="bg-surface rounded-xl p-3 mb-3">
                      <Text className="text-xs text-on-surface-variant mb-2">Point Relais</Text>
                      <Text className="text-sm font-bold text-primary">{pointRelais.nom}</Text>
                      {pointRelais.adresse ? (
                        <Text className="text-xs text-on-surface-variant mt-1">
                          {pointRelais.adresse}
                        </Text>
                      ) : null}
                      {pointRelais.telephone ? (
                        <Text className="text-xs text-on-surface-variant mt-1">
                          Tel: {pointRelais.telephone}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Contrat PDF */}
                  {contrat && (contrat.urlPdfBilingue || contrat.urlPdf) ? (
                    <View className="bg-surface rounded-xl p-3 mb-3">
                      <Text className="text-xs text-on-surface-variant mb-2">Contrat</Text>
                      <Text className="text-xs text-on-surface">
                        Numero: {contrat.numContrat || '-'}
                      </Text>
                      <Pressable
                        onPress={() => handleDownloadPdf(selectedTransaction.id)}
                        className="mt-2 bg-primary rounded-lg py-2 items-center"
                      >
                        <Text className="text-white font-semibold text-xs">Télécharger le contrat PDF</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {/* Scans */}
                  {(selectedTransaction.scannedReception || selectedTransaction.scannedRetour) ? (
                    <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-emerald-800 font-bold mb-1">Validations</Text>
                      {selectedTransaction.scannedReception ? (
                        <Text className="text-xs text-emerald-800">✓ Reception validee</Text>
                      ) : null}
                      {selectedTransaction.scannedRetour ? (
                        <Text className="text-xs text-emerald-800">✓ Retour valide</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {caution > 0 ? (
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-amber-800">
                        Caution bloquee: {caution.toFixed(2)} MAD
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions selon le statut */}
                  {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                    <Pressable
                      onPress={() => handleGenerateQRReception(selectedTransaction.id)}
                      className="bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Generer QR Remise</Text>
                    </Pressable>
                  ) : null}

                  {type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                    <Pressable
                      onPress={() => openValidationModal('reception')}
                      className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="checkmark-done-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Valider Remise (scan)</Text>
                    </Pressable>
                  ) : null}

                  {type === 'PRET' && selectedTransaction.statut === 'EN_COURS' ? (
                    <Pressable
                      onPress={() => handleGenerateQRRetour(selectedTransaction.id)}
                      className="bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Generer QR Retour</Text>
                    </Pressable>
                  ) : null}

                  {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_COURS' ? (
                    <Pressable
                      onPress={() => openValidationModal('retour')}
                      className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="checkmark-done-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Confirmer Retour (scan)</Text>
                    </Pressable>
                  ) : null}

                  {type === 'PRET' && selectedTransaction.statut === 'EN_ATTENTE_RETOUR' ? (
                    <Pressable
                      onPress={() => handleFinalizeRetour(selectedTransaction.id)}
                      className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Finaliser Retour</Text>
                    </Pressable>
                  ) : null}

                  {type === 'EMPRUNT' && selectedTransaction.statut === 'EN_ATTENTE_RECEPTION' ? (
                    <Pressable
                      onPress={() => handleAnnulerReservation(selectedTransaction.id)}
                      className="bg-red-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Annuler Reservation</Text>
                    </Pressable>
                  ) : null}

                  {type === 'PRET' && selectedTransaction.statut === 'TERMINEE' ? (
                    <Pressable
                      onPress={() => handleSignalerDegradation(selectedTransaction.id)}
                      className="bg-red-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                    >
                      <Ionicons name="alert-circle-outline" size={18} color="#fff" />
                      <Text className="text-white font-bold">Signaler Degradation</Text>
                    </Pressable>
                  ) : null}

                  {selectedTransaction.annonce?.id ? (
                    <>
                      <Pressable
                        onPress={async () => {
                          const isEmprunteur = getTransactionType(selectedTransaction) === 'EMPRUNT';
                          const otherId = isEmprunteur ? selectedTransaction.preteurId : selectedTransaction.emprunteurId;
                          setShowDetailModal(false);
                          
                          // Attendre un peu pour que le modal se ferme
                          setTimeout(() => {
                            router.push(`/(tabs)/chat?openChat=${selectedTransaction.annonce.id}&otherId=${otherId}`);
                          }, 300);
                        }}
                        className="bg-emerald-600 rounded-xl py-3.5 items-center justify-center flex-row gap-2 mb-2"
                      >
                        <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                        <Text className="text-white font-bold">Discuter</Text>
                      </Pressable>

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
                    </>
                  ) : null}
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
                    ? 'Montrez ce QR au preteur pour valider la remise'
                    : 'Montrez ce QR a l\'emprunteur pour valider le retour'}
                </Text>

                {qrRawCode ? (
                  <>
                    <Pressable
                      onPress={handleCopyQrCode}
                      className="bg-white border border-outline-variant rounded-xl py-2.5 px-4 mt-4"
                    >
                      <Text className="text-primary font-bold">Copier le code brut</Text>
                    </Pressable>
                    <Text selectable className="text-[10px] text-on-surface-variant text-center mt-3 px-2" numberOfLines={3}>
                      {qrRawCode}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : (
              <View className="items-center py-10">
                <Ionicons name="alert-circle-outline" size={26} color="#A5A6AA" />
                <Text className="text-sm text-on-surface-variant mt-3 text-center">
                  QR image non disponible. Utilisez le code brut si affiché.
                </Text>

                {qrRawCode ? (
                  <>
                    <Pressable
                      onPress={handleCopyQrCode}
                      className="bg-white border border-outline-variant rounded-xl py-2.5 px-4 mt-4"
                    >
                      <Text className="text-primary font-bold">Copier le code brut</Text>
                    </Pressable>
                    <Text selectable className="text-[10px] text-on-surface-variant text-center mt-3 px-2" numberOfLines={4}>
                      {qrRawCode}
                    </Text>
                  </>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Validation QR */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="slide"
        onRequestClose={closeValidationFlow}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-primary">
                {validationType === 'reception' ? 'Valider Remise' : 'Confirmer Retour'}
              </Text>
              <Pressable onPress={closeValidationFlow}>
                <Ionicons name="close" size={24} color="#1B4332" />
              </Pressable>
            </View>

            <Text className="text-xs text-on-surface-variant mb-2">Code QR scanné (ou token)</Text>
            <TextInput
              value={validationCode}
              onChangeText={setValidationCode}
              placeholder="Collez le code scanné ici"
              multiline
              className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface min-h-[110px]"
              textAlignVertical="top"
            />

            <Pressable
              onPress={openCameraScanner}
              className="bg-white border border-outline-variant rounded-xl py-3 items-center justify-center mt-3 flex-row gap-2"
            >
              <Ionicons name="scan-outline" size={18} color="#1B4332" />
              <Text className="text-primary font-bold">Scanner avec la caméra</Text>
            </Pressable>

            {isScannerActive ? (
              <View className="mt-3 rounded-2xl overflow-hidden border border-outline-variant">
                <View style={{ height: 260 }}>
                  <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                </View>

                <View className="p-3 bg-surface border-t border-outline-variant">
                  <Text className="text-xs text-on-surface-variant text-center">
                    Placez le QR dans le cadre pour scanner automatiquement.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setIsScannerActive(false);
                      setScanLocked(false);
                    }}
                    className="mt-2 bg-white border border-outline-variant rounded-lg py-2 items-center"
                  >
                    <Text className="text-primary font-semibold text-xs">Fermer le scanner</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={handleValidateQr}
              disabled={isValidating}
              className="bg-primary rounded-xl py-3.5 items-center justify-center mt-4"
            >
              {isValidating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Valider</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}
