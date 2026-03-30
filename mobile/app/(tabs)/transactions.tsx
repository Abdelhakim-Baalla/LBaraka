import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Écran transactions avec réservations et QR codes
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
        <Text className="text-base font-extrabold text-primary mb-1">Transactions</Text>
        <Text className="text-sm text-on-surface-variant">Suivez les réservations, remises et retours en un seul endroit.</Text>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3">
        <View className="flex-row items-center gap-3">
          <Ionicons name="time-outline" size={20} color="#1B4332" />
          <Text className="text-on-surface font-semibold">En attente de réception</Text>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-5">
        <View className="flex-row items-center gap-3">
          <Ionicons name="checkmark-circle-outline" size={20} color="#1B4332" />
          <Text className="text-on-surface font-semibold">Terminées</Text>
        </View>
      </View>

      <Pressable className="bg-primary rounded-xl py-3.5 items-center justify-center flex-row gap-2">
        <Ionicons name="qr-code-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Scanner un QR</Text>
      </Pressable>
    </View>
  );
}
