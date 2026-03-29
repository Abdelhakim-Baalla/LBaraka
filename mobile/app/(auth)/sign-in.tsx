import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function SignIn() {
  const router = useRouter();

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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          motDePasse: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

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
      <View className="bg-white/70 backdrop-blur-xl shadow-lg px-6 h-16 flex-row items-center justify-between">
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl items-center justify-center active:bg-primary-fixed/20"
        >
          <Ionicons name="arrow-back" size={24} color="#012d1d" />
        </Pressable>
        <Text className="text-xl font-bold tracking-widest text-primary">LBARAKA</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-24 pb-12" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="mb-10">
          <Text className="text-4xl font-bold text-primary leading-tight mb-3">
            Welcome Back
          </Text>
          <Text className="text-lg text-on-surface-variant/80 leading-relaxed">
            Re-enter the LBaraka community—a digital sanctuary engineered for growth, connection, and timeless excellence.
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-5">
          {/* Email */}
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Email Address
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              autoCapitalize="none"
              value={email}
              placeholder="architect@lbaraka.com"
              placeholderTextColor="#717973"
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Secure Password
            </Text>
            <View className="relative">
              <TextInput
                className="w-full bg-surface-container-high rounded-xl px-5 py-4 pr-14 text-on-surface text-base"
                value={password}
                placeholder="••••••••••••"
                placeholderTextColor="#717973"
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
                  size={20} 
                  color="#717973" 
                />
              </Pressable>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="flex-row items-center justify-between px-1">
            <Pressable 
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center gap-3"
              disabled={isLoading}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                rememberMe ? 'bg-primary border-primary' : 'bg-surface-container-low border-outline-variant'
              }`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <Text className="text-sm font-semibold text-on-surface-variant">Remember Me</Text>
            </Pressable>
            <Pressable>
              <Text className="text-sm font-bold text-secondary">Forgot Password?</Text>
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!email || !password || isLoading}
          className={`w-full bg-primary-container rounded-xl py-5 px-6 flex-row items-center justify-between shadow-lg mt-8 ${
            (!email || !password || isLoading) ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {isLoading ? 'Connexion...' : 'Enter the Riad'}
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          )}
        </Pressable>

        {/* Divider */}
        <View className="relative flex-row items-center justify-center my-10">
          <View className="absolute w-full border-t border-outline-variant/30" />
          <Text className="bg-surface px-4 text-[10px] font-bold uppercase tracking-widest text-outline">
            Or Continue With
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View className="flex-row gap-4 mb-12">
          <Pressable className="flex-1 flex-row items-center justify-center gap-3 bg-white border border-outline-variant/20 rounded-xl py-4 shadow-sm active:bg-surface-container-low">
            <Ionicons name="logo-google" size={20} color="#191c1d" />
            <Text className="text-sm font-semibold text-on-surface">Google</Text>
          </Pressable>
          <Pressable className="flex-1 flex-row items-center justify-center gap-3 bg-white border border-outline-variant/20 rounded-xl py-4 shadow-sm active:bg-surface-container-low">
            <Ionicons name="logo-apple" size={20} color="#191c1d" />
            <Text className="text-sm font-semibold text-on-surface">Apple</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="items-center pb-8">
          <View className="flex-row items-center">
            <Text className="text-on-surface-variant font-medium">New to LBaraka? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="text-primary font-bold ml-1">Join the community</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Decorative Elements */}
      <View className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
      <View className="absolute top-20 -right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" style={{ opacity: 0.3 }} />
    </KeyboardAvoidingView>
  );
}
