import { View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInUp, SlideInLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Onboarding = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goToSignUp = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/sign-up');
  };

  const goToSignIn = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 bg-surface px-5 pb-7" style={{ paddingTop: insets.top + 14 }}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} className="flex-row items-center justify-between mb-5">
        <View className="bg-primary/10 self-start px-3 py-1.5 rounded-full">
          <Text className="text-primary font-extrabold text-[11px] tracking-wide">LBARAKA</Text>
        </View>
        <Pressable onPress={goToSignIn} className="px-2 py-1.5">
          <Text className="text-primary font-bold text-xs">Passer</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={SlideInLeft.delay(200).duration(600)} className="mb-5">
        <Text className="text-[32px] leading-[38px] font-extrabold text-primary">
          Prêtez et partagez
          {'\n'}dans votre quartier.
        </Text>
        <Text className="text-sm text-on-surface-variant mt-3 leading-6">
          Réduisez le gaspillage, gagnez des points et créez un vrai impact local avec une expérience simple et moderne.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(600)} className="relative rounded-[28px] overflow-hidden border border-outline-variant/50">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80' }}
          className="w-full h-72"
          resizeMode="cover"
        />
        <View className="absolute left-4 right-4 bottom-4 bg-black/35 rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="leaf-outline" size={16} color="#ffffff" />
            <Text className="text-white font-bold text-xs">Communauté responsable</Text>
          </View>
          <Text className="text-white/90 text-xs leading-5">
            Objets, entraide, food rescue, points relais et suivi transparent de vos échanges.
          </Text>
        </View>
      </Animated.View>

      <View className="mt-auto pt-6 gap-3.5">
        <Pressable
          onPress={goToSignUp}
          className="bg-primary rounded-2xl py-4 px-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles-outline" size={18} color="#ffffff" />
            <Text className="text-white font-bold text-base">Créer un compte</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        <Pressable
          onPress={goToSignIn}
          className="bg-white border border-outline-variant rounded-2xl py-4 px-4 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="log-in-outline" size={18} color="#1B4332" />
          <Text className="text-primary font-bold">J'ai déjà un compte</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default Onboarding