import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GET /points-relais - Liste des points relais
// GET /points-relais/nearby - Points relais à proximité
// Query params: lat, lng, rayon (km), type (HANOUT | MOSQUEE | ASSOCIATION_QUARTIER)
// GET /points-relais/types - Liste des types disponibles
export default function PointsRelaisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Points Relais</Text>
          <Ionicons name="storefront-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">Hanout, mosquée ou association proche pour faciliter les échanges.</Text>
      </View>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-52 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <Pressable
        onPress={() => router.push('/(tabs)/map')}
        className="bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2"
      >
        <Ionicons name="map-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Retour à la carte</Text>
      </Pressable>
    </View>
  );
}
