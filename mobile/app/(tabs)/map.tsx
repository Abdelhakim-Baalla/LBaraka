import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GET /annonces/carte - Annonces à proximité (géolocalisées)
// Query params: lat, lng, rayon (km), categorie (optional)
export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Carte Communautaire</Text>
          <Ionicons name="map-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">
          Visualisez les annonces proches et les points relais autour de vous.
        </Text>
      </View>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1552550018-5253c1b171e1?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-56 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <Pressable
        onPress={() => router.push('/(points-relais)')}
        className="bg-primary rounded-xl py-4 px-4 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="storefront-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Voir les points relais</Text>
      </Pressable>
    </View>
  );
}
