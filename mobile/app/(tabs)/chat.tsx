import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GET /chat/conversations - Liste des conversations
// GET /chat/:otherId/:annonceId - Historique d'une conversation
// POST /chat - Envoyer un message HTTP (fallback)
// Socket.IO: ws://localhost:3000/chat
// Events: joinRoom, leaveRoom, sendMessage, typing, registerNotifications
// Listen: userJoined, receiveMessage, userTyping, newMessageNotification
export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Messagerie</Text>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">Discutez avec les membres avant la remise de l'objet.</Text>
      </View>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-44 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <Pressable className="bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2">
        <Ionicons name="send-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Ouvrir une conversation</Text>
      </Pressable>
    </View>
  );
}
