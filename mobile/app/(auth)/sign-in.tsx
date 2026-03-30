import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const data = await ApiService.loginWithBackend(
        email.trim().toLowerCase(),
        password,
      );

      // Save token
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.utilisateur));

      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Erreur', error.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      {/* Header */}
      <View
        className="bg-white/70 backdrop-blur-xl shadow-lg px-6 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8, paddingBottom: 8 }}
      >
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl items-center justify-center active:bg-primary-fixed/20"
        >
          <Ionicons name="arrow-back" size={24} color="#012d1d" />
        </Pressable>
        <Text className="text-xl font-bold tracking-widest text-primary">LBARAKA</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-8" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-primary mb-1">Se connecter</Text>
          <Text className="text-sm text-on-surface-variant leading-5">
            Accédez à vos échanges et continuez votre parcours LBaraka.
          </Text>
        </View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="gap-4 mb-6">
          {/* Email */}
          <View>
            <Text className="text-xs font-bold text-on-surface-variant/70 mb-2">E-MAIL</Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-4 py-3.5 h-12 text-on-surface text-base border border-outline-variant/40"
              autoCapitalize="none"
              value={email}
              placeholder="votre@email.com"
              placeholderTextColor="#a5a6aa"
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-xs font-bold text-on-surface-variant/70 mb-2">MOT DE PASSE</Text>
            <View className="relative">
              <TextInput
                className="w-full bg-surface-container-high rounded-xl px-4 py-3.5 h-12 pr-12 text-on-surface text-base border border-outline-variant/40"
                value={password}
                placeholder="••••••••••••"
                placeholderTextColor="#a5a6aa"
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={18} 
                  color="#414844" 
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!email || !password || isLoading}
          className={`w-full bg-primary rounded-xl py-3.5 h-12 px-5 flex-row items-center justify-center gap-2 mt-6 ${
            (!email || !password || isLoading) ? 'opacity-60' : ''
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text className="text-white font-bold text-base">Se connecter</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View className="items-center mt-8">
          <View className="flex-row items-center gap-1">
            <Text className="text-on-surface-variant text-sm">Pas encore de compte ? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="text-primary font-bold text-sm">S'inscrire</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>


    </KeyboardAvoidingView>
  );
}
