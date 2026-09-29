import { useCallback, useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '@/services/api';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadowSm } from '@/theme/tokens';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Chip';
import { T } from '@/components/ui/T';
import { Avatar, EmptyState } from '@/components/ui/Primitives';
import { PressableScale } from '@/components/ui/PressableScale';
import { Enter } from '@/components/ui/Enter';
import { Segmented } from '@/components/ui/Segmented';

const STATUS_TONES: Record<string, 'gold' | 'info' | 'primary' | 'success' | 'danger' | 'muted'> = {
  EN_ATTENTE_RECEPTION: 'gold',
  EN_COURS: 'info',
  EN_ATTENTE_RETOUR: 'primary',
  TERMINEE: 'success',
  ANNULEE: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE_RECEPTION: 'En attente réception',
  EN_COURS: 'En cours',
  EN_ATTENTE_RETOUR: 'En attente retour',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export default function ChatScreen() {
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'conversations' | 'reservations'>('conversations');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Gérer l'ouverture automatique d'une conversation via les paramètres
  useEffect(() => {
    const autoOpenChat = async () => {
      if (params?.openChat && params?.otherId && currentUserId) {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return;

        try {
          const data = await ApiService.getChatHistory(token, String(params.otherId), String(params.openChat));
          setMessages(data || []);
          setSelectedConvo({
            _id: { annonceId: String(params.openChat), participants: [currentUserId, String(params.otherId)] },
            lastMessage: data[data.length - 1] || {},
          });
          setShowChatModal(true);
        } catch (error) {
          console.error('Error auto-opening chat:', error);
          Alert.alert('Erreur', "Impossible d'ouvrir la conversation");
        }
      }
    };

    if (currentUserId) {
      autoOpenChat();
    }
  }, [params?.openChat, params?.otherId, currentUserId]);

  const loadData = async () => {
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
        setCurrentUserId(user?.id || '');
      }

      const [convos, trans] = await Promise.all([
        ApiService.getConversations(token),
        ApiService.getMyTransactions(token),
      ]);

      setConversations(Array.isArray(convos) ? convos : []);
      setReservations(Array.isArray(trans) ? trans : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openConversation = async (convo: any) => {
    try {
      setSelectedConvo(convo);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const annonceId = convo._id?.annonceId || '';
      const participants = convo._id?.participants || [];
      const otherId = participants.find((p: string) => p !== currentUserId) || '';

      if (!annonceId || !otherId) return;

      const data = await ApiService.getChatHistory(token, otherId, annonceId);
      setMessages(data || []);
      setShowChatModal(true);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const openReservationChat = async (reservation: any) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const annonceId = reservation.annonceId;
      const isEmprunteur = reservation.emprunteurId === currentUserId;
      const otherId = isEmprunteur ? reservation.preteurId : reservation.emprunteurId;

      if (!annonceId || !otherId) return;

      const data = await ApiService.getChatHistory(token, otherId, annonceId);
      setMessages(data || []);
      setSelectedConvo({
        _id: { annonceId, participants: [currentUserId, otherId] },
        lastMessage: data[data.length - 1] || {},
        reservation,
      });
      setShowChatModal(true);
    } catch (error) {
      console.error('Error opening reservation chat:', error);
    }
  };

  const downloadContract = async (transactionId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const contrat = await ApiService.getContractByTransaction(token, transactionId);
      if (contrat?.urlPdfBilingue) {
        const supported = await Linking.canOpenURL(contrat.urlPdfBilingue);
        if (supported) {
          await Linking.openURL(contrat.urlPdfBilingue);
        } else {
          Alert.alert('Erreur', "Impossible d'ouvrir le PDF");
        }
      } else {
        Alert.alert('Info', 'Contrat non disponible');
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le contrat');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConvo) return;

    try {
      setIsSending(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const annonceId = selectedConvo._id?.annonceId || '';
      const participants = selectedConvo._id?.participants || [];
      const receiverId = participants.find((p: string) => p !== currentUserId) || '';

      await ApiService.sendMessage(token, {
        receiverId,
        annonceId,
        type: 'TEXT',
        content: messageText.trim(),
      });

      setMessageText('');

      // Recharger les messages
      const data = await ApiService.getChatHistory(token, receiverId, annonceId);
      setMessages(data || []);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoicePress = () => {
    Alert.alert('Message vocal', 'Les messages vocaux seront bientôt disponibles.');
  };

  const handleAttachPress = () => {
    Alert.alert('Pièce jointe', 'Les pièces jointes seront bientôt disponibles.');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dayLabel = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const convoDisplayName = (convo: any) => {
    const annonceId = convo?._id?.annonceId || '';
    return annonceId ? `Annonce ${annonceId.substring(0, 8)}` : 'Conversation';
  };

  if (isLoading) {
    return (
      <Screen padBottom={108}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </Screen>
    );
  }

  const threadTitle =
    selectedConvo?.reservation?.annonce?.titre ||
    (selectedConvo?._id?.annonceId ? `Annonce ${String(selectedConvo._id.annonceId).substring(0, 8)}` : 'Conversation');
  const threadAnnonceId = selectedConvo?._id?.annonceId || '';
  let lastThreadDay = '';

  return (
    <Screen padBottom={108}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <Enter index={0}>
          <View style={{ marginTop: 8 }}>
            <T kind="overline" color={c.muted}>Espace Discussion</T>
            <T kind="h1" style={{ marginTop: 4 }}>Messagerie</T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Tag label={`${conversations.length} conversations`} tone="primary" />
              <Tag label={`${reservations.length} réservations`} tone="info" />
            </View>
          </View>
        </Enter>

        {/* Tabs */}
        <Enter index={1}>
          <View style={{ marginTop: 16 }}>
            <Segmented
              options={[
                { value: 'conversations', label: 'Conversations' },
                { value: 'reservations', label: 'Réservations' },
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as typeof activeTab)}
            />
          </View>
        </Enter>

        {activeTab === 'conversations' ? (
          <>
            {conversations.length === 0 ? (
              <Enter index={2}>
                <Card style={{ marginTop: 12 }}>
                  <EmptyState
                    icon="chatbubbles-outline"
                    title="Aucune conversation pour le moment"
                    body="Réservez une annonce pour démarrer une discussion"
                  />
                </Card>
              </Enter>
            ) : (
              conversations.map((convo, index) => {
                const lastMessage = convo.lastMessage || {};
                const isFromMe = lastMessage.senderId === currentUserId;
                const name = convoDisplayName(convo);
                const preview = lastMessage.content
                  ? `${isFromMe ? 'Vous : ' : ''}${lastMessage.content}`
                  : 'Aucun message pour le moment';
                const unread = Boolean(lastMessage.content) && !isFromMe;

                return (
                  <Enter key={`convo-${index}`} index={Math.min(index, 6)}>
                    <PressableScale
                      onPress={() => openConversation(convo)}
                      style={{
                        backgroundColor: c.surface,
                        borderRadius: radius.lg,
                        padding: 14,
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        ...shadowSm(mode),
                      }}
                    >
                      <Avatar name={name} size={56} />
                      <View style={{ flex: 1 }}>
                        <T kind="bodyStrong" numberOfLines={1}>
                          {name}
                        </T>
                        <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                          {preview}
                        </T>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <T kind="caption" color={c.muted}>
                          {formatTime(lastMessage.createdAt)}
                        </T>
                        {unread ? (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: radius.pill,
                              backgroundColor: c.primary,
                            }}
                          />
                        ) : (
                          <Ionicons name="chevron-forward" size={16} color={c.muted} />
                        )}
                      </View>
                    </PressableScale>
                  </Enter>
                );
              })
            )}

            <Enter index={3}>
              <Card style={{ marginTop: 12, backgroundColor: c.goldSoft }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="information-circle-outline" size={20} color={c.onGoldSoft} />
                  <T kind="bodyStrong" color={c.onGoldSoft}>Astuce messagerie</T>
                </View>
                <T kind="small" color={c.onGoldSoft} style={{ marginTop: 6 }}>
                  Cliquez sur « Discuter » dans les détails d&apos;une annonce ou transaction pour démarrer une conversation.
                </T>
              </Card>
            </Enter>
          </>
        ) : (
          <>
            {reservations.length === 0 ? (
              <Enter index={2}>
                <Card style={{ marginTop: 12 }}>
                  <EmptyState
                    icon="calendar-outline"
                    title="Aucune réservation active"
                    body="Réservez une annonce pour commencer"
                  />
                </Card>
              </Enter>
            ) : (
              reservations.map((reservation, index) => {
                const isEmprunteur = reservation.emprunteurId === currentUserId;
                const tone = STATUS_TONES[reservation.statut] || 'muted';
                const title = reservation.annonce?.titre || 'Annonce';

                return (
                  <Enter key={`res-${index}`} index={Math.min(index, 6)}>
                    <View
                      style={{
                        backgroundColor: c.surface,
                        borderRadius: radius.lg,
                        padding: 14,
                        marginTop: 10,
                        ...shadowSm(mode),
                      }}
                    >
                      <PressableScale onPress={() => openReservationChat(reservation)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Avatar name={title} size={56} />
                          <View style={{ flex: 1 }}>
                            <T kind="bodyStrong" numberOfLines={1}>
                              {title}
                            </T>
                            <T kind="small" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                              {isEmprunteur ? 'Vous empruntez' : 'Vous prêtez'}
                            </T>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            <Tag label={STATUS_LABELS[reservation.statut] || reservation.statut} tone={tone} />
                            <Ionicons name="chevron-forward" size={16} color={c.muted} />
                          </View>
                        </View>
                      </PressableScale>

                      <View style={{ backgroundColor: c.surface2, borderRadius: radius.md, padding: 12, marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <T kind="small" color={c.muted}>Caution bloquée</T>
                          <T kind="bodyStrong" color={c.primary}>{reservation.montantCautionBloquee} DH</T>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <T kind="small" color={c.muted}>Dates</T>
                          <T kind="small">
                            {new Date(reservation.dateDebut).toLocaleDateString('fr-FR')} → {new Date(reservation.dateFin).toLocaleDateString('fr-FR')}
                          </T>
                        </View>
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Button title="Discuter" icon="chatbubble-outline" size="md" onPress={() => openReservationChat(reservation)} />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <PressableScale
                          onPress={() => downloadContract(reservation.id)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            backgroundColor: c.surface2,
                            borderRadius: radius.md,
                            height: 46,
                          }}
                        >
                          <Ionicons name="document-text-outline" size={18} color={c.primary} />
                          <T kind="bodyStrong" color={c.primary}>Contrat</T>
                        </PressableScale>
                        <PressableScale
                          onPress={() => router.push(`/(annonces)/${reservation.annonceId}`)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            backgroundColor: c.surface2,
                            borderRadius: radius.md,
                            height: 46,
                          }}
                        >
                          <Ionicons name="eye-outline" size={18} color={c.primary} />
                          <T kind="bodyStrong" color={c.primary}>Annonce</T>
                        </PressableScale>
                      </View>
                    </View>
                  </Enter>
                );
              })
            )}

            <Enter index={3}>
              <Card style={{ marginTop: 12, backgroundColor: c.infoSoft }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="information-circle-outline" size={20} color={c.onInfoSoft} />
                  <T kind="bodyStrong" color={c.onInfoSoft}>Astuce réservations</T>
                </View>
                <T kind="small" color={c.onInfoSoft} style={{ marginTop: 6 }}>
                  Cliquez sur « Discuter » pour communiquer avec l&apos;autre partie. Le contrat PDF est disponible via le bouton contrat.
                </T>
              </Card>
            </Enter>
          </>
        )}
      </ScrollView>

      {/* Modal Chat */}
      <Modal visible={showChatModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: c.bg }}
        >
          <View style={{ flex: 1, paddingTop: insets.top + 10 }}>
            {/* Mini-profile bar */}
            <View
              style={{
                backgroundColor: c.surface,
                borderBottomWidth: 1,
                borderBottomColor: c.line,
                paddingHorizontal: 16,
                paddingBottom: 12,
                borderBottomLeftRadius: radius.lg,
                borderBottomRightRadius: radius.lg,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={threadTitle} size={44} />
                <View style={{ flex: 1 }}>
                  <T kind="bodyStrong" numberOfLines={1}>{threadTitle}</T>
                  <T kind="caption" color={c.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                    {threadAnnonceId ? `Annonce ${threadAnnonceId.substring(0, 8)} · ` : ''}{messages.length} message{messages.length > 1 ? 's' : ''}
                  </T>
                </View>
                {selectedConvo?.reservation ? (
                  <PressableScale
                    onPress={() => downloadContract(selectedConvo.reservation.id)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      backgroundColor: c.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="document-text-outline" size={20} color={c.ink} />
                  </PressableScale>
                ) : null}
                <PressableScale
                  onPress={() => {
                    const annonceId = selectedConvo?._id?.annonceId;
                    if (annonceId) {
                      setShowChatModal(false);
                      router.push(`/(annonces)/${annonceId}`);
                    }
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: c.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={c.ink} />
                </PressableScale>
                <PressableScale
                  onPress={() => setShowChatModal(false)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: c.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={22} color={c.ink} />
                </PressableScale>
              </View>
            </View>

            {/* Messages */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
              {messages.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: radius.pill,
                      backgroundColor: c.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="chatbubbles-outline" size={38} color={c.onPrimarySoft} />
                  </View>
                  <T kind="h3" center>Aucun message</T>
                  <T kind="body" color={c.muted} center style={{ marginTop: 8, paddingHorizontal: 24 }}>
                    Commencez la conversation en envoyant un message
                  </T>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isFromMe = msg.senderId === currentUserId;
                  const day = dayLabel(msg.createdAt);
                  const showDay = Boolean(day) && day !== lastThreadDay;
                  lastThreadDay = day || lastThreadDay;
                  return (
                    <View key={`msg-${index}`}>
                      {showDay ? (
                        <View style={{ alignItems: 'center', marginVertical: 10 }}>
                          <View
                            style={{
                              backgroundColor: c.surface2,
                              borderRadius: radius.pill,
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                            }}
                          >
                            <T kind="caption" color={c.muted} style={{ textTransform: 'capitalize' }}>
                              {day}
                            </T>
                          </View>
                        </View>
                      ) : null}
                      <View
                        style={{ marginBottom: 10, alignItems: isFromMe ? 'flex-end' : 'flex-start' }}
                      >
                        <View
                          style={{
                            maxWidth: '78%',
                            borderRadius: radius.lg,
                            borderTopRightRadius: isFromMe ? 6 : radius.lg,
                            borderTopLeftRadius: isFromMe ? radius.lg : 6,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            backgroundColor: isFromMe ? c.primary : c.surface2,
                          }}
                        >
                          <T kind="body" color={isFromMe ? c.onPrimary : c.ink}>
                            {msg.content}
                          </T>
                          <T
                            kind="caption"
                            color={isFromMe ? c.onPrimary : c.muted}
                            style={{ marginTop: 4, opacity: isFromMe ? 0.85 : 1 }}
                          >
                            {formatTime(msg.createdAt)}
                          </T>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Sticky input bar */}
            <View
              style={{
                backgroundColor: c.surface,
                borderTopWidth: 1,
                borderTopColor: c.line,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: insets.bottom + 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: radius.xl,
                  paddingHorizontal: 6,
                  paddingVertical: 6,
                  minHeight: 60,
                }}
              >
                <PressableScale
                  onPress={handleAttachPress}
                  accessibilityLabel="Pièce jointe"
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={24} color={c.muted} />
                </PressableScale>
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Votre message..."
                  placeholderTextColor={c.muted}
                  multiline
                  style={{ flex: 1, color: c.ink, fontSize: 15, minHeight: 22, maxHeight: 96 }}
                />
                <PressableScale
                  onPress={handleVoicePress}
                  accessibilityLabel="Message vocal"
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="mic-outline" size={22} color={c.muted} />
                </PressableScale>
                <PressableScale
                  onPress={sendMessage}
                  disabled={isSending || !messageText.trim()}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.pill,
                    backgroundColor: c.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isSending || !messageText.trim() ? 0.5 : 1,
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator color={c.onPrimary} size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color={c.onPrimary} />
                  )}
                </PressableScale>
              </View>
              <View style={{ marginTop: 8 }}>
                <T kind="caption" color={c.muted} center>
                  {messages.length} message{messages.length > 1 ? 's' : ''} · Réponses rapides et cordiales recommandées
                </T>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
