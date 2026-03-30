import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// GET /annonces/food-rescue - Liste des Food Rescue actifs
export default function FoodRescueScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface px-4" style={{ paddingTop: insets.top + 10 }}>
      <View className="bg-white rounded-2xl p-4 border border-outline-variant mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-extrabold text-primary">Food Rescue</Text>
          <Ionicons name="restaurant-outline" size={20} color="#1B4332" />
        </View>
        <Text className="text-sm text-on-surface-variant">Repas et invendus à récupérer rapidement dans votre quartier.</Text>
      </View>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=70' }}
        className="w-full h-52 rounded-2xl mb-4"
        resizeMode="cover"
      />

      <Pressable className="bg-primary rounded-xl py-4 items-center justify-center flex-row gap-2">
        <Ionicons name="flash-outline" size={18} color="#fff" />
        <Text className="text-white font-bold">Voir les offres urgentes</Text>
      </Pressable>
    </View>
  );
}
