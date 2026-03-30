import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ApiService } from '../../services/api';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
          Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF');
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
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
    <View className="flex-1 bg-surface">
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} className="bg-white/90 border-b border-outline-variant/30 px-5 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-on-surface-variant">Espace Discussion</Text>
            <Text className="text-base font-extrabold text-primary">Messagerie</Text>
          </View>
          <View className="bg-primary/10 px-3 py-2 rounded-lg">
            <Text className="text-xs font-bold text-primary">
              {activeTab === 'conversations' ? conversations.length : reservations.length}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setActiveTab('conversations')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'conversations' ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text className={`text-center text-sm font-bold ${activeTab === 'conversations' ? 'text-white' : 'text-on-surface-variant'}`}>
              Conversations
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('reservations')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'reservations' ? 'bg-primary' : 'bg-surface'}`}
          >
            <Text className={`text-center text-sm font-bold ${activeTab === 'reservations' ? 'text-white' : 'text-on-surface-variant'}`}>
              Réservations
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Contenu */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        {activeTab === 'conversations' ? (
          <>
            <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1B4332" />
                <Text className="text-sm font-extrabold text-primary">Vos conversations</Text>
              </View>
              <Text className="text-xs text-on-surface-variant">
                Discutez avec les membres avant la remise de l'objet.
              </Text>
            </Animated.View>

            {conversations.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-white rounded-2xl p-6 border border-outline-variant items-center">
            <Ionicons name="chatbubbles-outline" size={32} color="#A5A6AA" />
            <Text className="text-sm text-on-surface-variant text-center mt-3">
              Aucune conversation pour le moment
            </Text>
            <Text className="text-xs text-on-surface-variant text-center mt-1">
              Réservez une annonce pour démarrer une discussion
            </Text>
          </Animated.View>
        ) : (
          conversations.map((convo, index) => {
            const lastMessage = convo.lastMessage || {};
            const annonceId = convo._id?.annonceId || '';
            const participants = convo._id?.participants || [];
            const isFromMe = lastMessage.senderId === currentUserId;

            return (
              <Animated.View key={`convo-${index}`} entering={FadeInUp.delay(150 + index * 50).duration(600)}>
                <Pressable
                  onPress={() => openConversation(convo)}
                  className="bg-white border border-outline-variant rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                        Annonce: {annonceId.substring(0, 8)}...
                      </Text>
                      <Text className="text-xs text-on-surface-variant mt-1">
                        {participants.length} participant{participants.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View className="bg-primary/10 rounded-full p-2">
                      <Ionicons name="chatbubble-outline" size={16} color="#1B4332" />
                    </View>
                  </View>

                  {lastMessage.content ? (
                    <View className="bg-surface rounded-xl p-2 mt-2">
                      <Text className="text-xs text-on-surface" numberOfLines={2}>
                        {isFromMe ? 'Vous: ' : ''}{lastMessage.content}
                      </Text>
                      <Text className="text-[10px] text-on-surface-variant mt-1">
                        {formatDate(lastMessage.createdAt)}
                      </Text>
                    </View>
                  ) : null}

                  <View className="flex-row items-center justify-end mt-2">
                    <Ionicons name="chevron-forward" size={16} color="#1B4332" />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}

            <Animated.View entering={FadeInUp.delay(300).duration(600)} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-2">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="information-circle-outline" size={18} color="#b45309" />
                <Text className="text-sm font-bold text-amber-800">Astuce messagerie</Text>
              </View>
              <Text className="text-xs text-amber-800">
                Les conversations sont liées aux annonces. Réservez un objet pour démarrer une discussion avec le propriétaire.
              </Text>
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInUp.delay(100).duration(600)} className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="receipt-outline" size={20} color="#1B4332" />
                <Text className="text-sm font-extrabold text-primary">Vos réservations</Text>
              </View>
              <Text className="text-xs text-on-surface-variant">
                Gérez vos transactions et communiquez avec les autres membres.
              </Text>
            </Animated.View>

            {reservations.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(150).duration(600)} className="bg-white rounded-2xl p-6 border border-outline-variant items-center">
                <Ionicons name="calendar-outline" size={32} color="#A5A6AA" />
                <Text className="text-sm text-on-surface-variant text-center mt-3">
                  Aucune réservation active
                </Text>
                <Text className="text-xs text-on-surface-variant text-center mt-1">
                  Réservez une annonce pour commencer
                </Text>
              </Animated.View>
            ) : (
              reservations.map((reservation, index) => {
                const isEmprunteur = reservation.emprunteurId === currentUserId;
                const statusColors: any = {
                  EN_ATTENTE_RECEPTION: 'bg-amber-100 text-amber-800',
                  EN_COURS: 'bg-blue-100 text-blue-800',
                  EN_ATTENTE_RETOUR: 'bg-purple-100 text-purple-800',
                  TERMINEE: 'bg-green-100 text-green-800',
                  ANNULEE: 'bg-red-100 text-red-800',
                };
                const statusLabels: any = {
                  EN_ATTENTE_RECEPTION: 'En attente réception',
                  EN_COURS: 'En cours',
                  EN_ATTENTE_RETOUR: 'En attente retour',
                  TERMINEE: 'Terminée',
                  ANNULEE: 'Annulée',
                };

                return (
                  <Animated.View key={`res-${index}`} entering={FadeInUp.delay(150 + index * 50).duration(600)}>
                    <View className="bg-white border border-outline-variant rounded-2xl p-4 mb-3">
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                            {reservation.annonce?.titre || 'Annonce'}
                          </Text>
                          <Text className="text-xs text-on-surface-variant mt-1">
                            {isEmprunteur ? 'Vous empruntez' : 'Vous prêtez'}
                          </Text>
                        </View>
                        <View className={`px-3 py-1 rounded-lg ${statusColors[reservation.statut] || 'bg-gray-100'}`}>
                          <Text className={`text-[10px] font-bold ${statusColors[reservation.statut]?.split(' ')[1] || 'text-gray-800'}`}>
                            {statusLabels[reservation.statut] || reservation.statut}
                          </Text>
                        </View>
                      </View>

                      <View className="bg-surface rounded-xl p-3 mb-3">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-xs text-on-surface-variant">Caution bloquée</Text>
                          <Text className="text-sm font-bold text-primary">{reservation.montantCautionBloquee} DH</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-on-surface-variant">Dates</Text>
                          <Text className="text-xs text-on-surface">
                            {new Date(reservation.dateDebut).toLocaleDateString('fr-FR')} → {new Date(reservation.dateFin).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => openReservationChat(reservation)}
                          className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2"
                        >
                          <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                          <Text className="text-sm font-bold text-white">Discuter</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => downloadContract(reservation.id)}
                          className="bg-primary/10 rounded-xl px-4 py-3 flex-row items-center justify-center"
                        >
                          <Ionicons name="document-text-outline" size={16} color="#1B4332" />
                        </Pressable>
                        <Pressable
                          onPress={() => router.push(`/(annonces)/${reservation.annonceId}`)}
                          className="bg-primary/10 rounded-xl px-4 py-3 flex-row items-center justify-center"
                        >
                          <Ionicons name="eye-outline" size={16} color="#1B4332" />
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}

            <Animated.View entering={FadeInUp.delay(300).duration(600)} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-2">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="information-circle-outline" size={18} color="#1e40af" />
                <Text className="text-sm font-bold text-blue-800">Astuce réservations</Text>
              </View>
              <Text className="text-xs text-blue-800">
                Cliquez sur "Discuter" pour communiquer avec l'autre partie. Le contrat PDF est disponible via l'icône document.
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Modal Chat */}
      <Modal visible={showChatModal} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          className="bg-surface"
        >
          <View className="flex-1" style={{ paddingTop: insets.top + 10 }}>
            {/* Header Chat */}
            <View className="bg-white border-b border-outline-variant px-4 pb-3">
              <View className="flex-row items-center justify-between">
                <Pressable onPress={() => setShowChatModal(false)} className="mr-3">
                  <Ionicons name="arrow-back" size={24} color="#1B4332" />
                </Pressable>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                    Conversation
                  </Text>
                  <Text className="text-xs text-on-surface-variant">
                    {messages.length} message{messages.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {selectedConvo?.reservation && (
                    <Pressable
                      onPress={() => downloadContract(selectedConvo.reservation.id)}
                      className="bg-primary/10 rounded-lg px-3 py-2"
                    >
                      <Ionicons name="document-text-outline" size={16} color="#1B4332" />
                    </Pressable>
                  )}
                  <Pressable onPress={() => {
                    const annonceId = selectedConvo?._id?.annonceId;
                    if (annonceId) {
                      setShowChatModal(false);
                      router.push(`/(annonces)/${annonceId}`);
                    }
                  }} className="bg-primary/10 rounded-lg px-3 py-2">
                    <Text className="text-xs font-bold text-primary">Voir annonce</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Messages */}
            <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
              {messages.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20">
                  <Ionicons name="chatbubbles-outline" size={32} color="#A5A6AA" />
                  <Text className="text-sm text-on-surface-variant mt-3">Aucun message</Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isFromMe = msg.senderId === currentUserId;
                  return (
                    <View
                      key={`msg-${index}`}
                      className={`mb-3 ${isFromMe ? 'items-end' : 'items-start'}`}
                    >
                      <View
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isFromMe ? 'bg-primary' : 'bg-white border border-outline-variant'
                        }`}
                      >
                        <Text className={`text-sm ${isFromMe ? 'text-white' : 'text-on-surface'}`}>
                          {msg.content}
                        </Text>
                        <Text className={`text-[10px] mt-1 ${isFromMe ? 'text-white/70' : 'text-on-surface-variant'}`}>
                          {formatDate(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input Message */}
            <View className="bg-white border-t border-outline-variant px-4 py-3" style={{ paddingBottom: insets.bottom + 12 }}>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Votre message..."
                  multiline
                  className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-3 max-h-24"
                />
                <Pressable
                  onPress={sendMessage}
                  disabled={isSending || !messageText.trim()}
                  className={`rounded-xl p-3 ${
                    isSending || !messageText.trim() ? 'bg-primary/40' : 'bg-primary'
                  }`}
                >
                  {isSending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
