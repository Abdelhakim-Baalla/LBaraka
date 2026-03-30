import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// POST /annonces - Créer une annonce standard
// Body: titre, description, categorie, mode, condition, montantCaution, photosBase64, geolocalisation
// POST /annonces/food-rescue - Créer une annonce Food Rescue (PARTENAIRE only)
export default function CreateAnnonceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <Text className="text-lg font-extrabold text-primary">Nouvelle annonce</Text>
        <Text className="text-sm text-on-surface-variant mt-1">Ajoutez vos objets, photos et modalités de prêt.</Text>
      </View>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-52 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <Pressable
        onPress={() => router.push('/(tabs)/home')}
        className="bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2"
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text className="text-white font-bold">Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}
