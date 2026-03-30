import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GET /annonces/:id - Détails d'une annonce
// POST /transactions/reserve/:annonceId - Réserver une annonce
export default function AnnonceDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-56 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <Text className="text-lg font-extrabold text-primary">Détails annonce</Text>
        <Text className="text-sm text-on-surface-variant mt-1">Consultez les conditions et réservez en toute sécurité.</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/transactions')}
        className="bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2 mb-3"
      >
        <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Voir les transactions</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/home')}
        className="bg-white border border-outline-variant rounded-xl py-4 items-center justify-center flex-row gap-2"
      >
        <Ionicons name="home-outline" size={18} color="#1B4332" />
        <Text className="text-primary font-bold">Retour accueil</Text>
      </Pressable>
    </View>
  );
}
