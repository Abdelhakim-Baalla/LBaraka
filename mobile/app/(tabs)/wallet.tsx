import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Écran portefeuille avec solde et historique
export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-primary rounded-2xl p-4 mb-4">
        <Text className="text-white/80 text-xs font-semibold uppercase">Solde disponible</Text>
        <Text className="text-white text-2xl font-black mt-1">0 MAD</Text>
        <Text className="text-white/80 text-xs mt-1">Caution bloquée: 0 MAD</Text>
      </View>

      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Ionicons name="arrow-down-circle-outline" size={20} color="#1B4332" />
          <Text className="text-on-surface font-semibold">Déposer des fonds</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6c757d" />
      </View>

      <Pressable className="bg-white rounded-2xl p-4 border border-outline-variant flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Ionicons name="time-outline" size={20} color="#1B4332" />
          <Text className="text-on-surface font-semibold">Historique</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6c757d" />
      </Pressable>
    </View>
  );
}
