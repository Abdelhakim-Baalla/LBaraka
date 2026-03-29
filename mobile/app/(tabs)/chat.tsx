import { View, Text } from 'react-native';

// GET /chat/conversations - Liste des conversations
// GET /chat/:otherId/:annonceId - Historique d'une conversation
// POST /chat - Envoyer un message HTTP (fallback)
// Socket.IO: ws://localhost:3000/chat
// Events: joinRoom, leaveRoom, sendMessage, typing, registerNotifications
// Listen: userJoined, receiveMessage, userTyping, newMessageNotification
export default function ChatScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Chat</Text>
    </View>
  );
}
