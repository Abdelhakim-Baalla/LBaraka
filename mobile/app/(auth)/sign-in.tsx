import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '@/services/api';

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 600;
  const isLargeScreen = width >= 600;

  const horizontalPadding = isSmallScreen ? 16 : isMediumScreen ? 20 : 28;
  const verticalGap = isSmallScreen ? 16 : isMediumScreen ? 18 : 20;
  const inputHeight = isSmallScreen ? 44 : isMediumScreen ? 48 : 52;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Gère la connexion utilisateur
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await ApiService.loginWithBackend(email, password);

      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.utilisateur || result.user));
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');

        router.replace('/(tabs)/home');
      } else {
        setError('Connexion échouée: Aucun token reçu');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion. Vérifiez vos données.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            minHeight: '100%',
          }}
          bounces={false}
        >
          <View style={{ paddingHorizontal: horizontalPadding, paddingTop: insets.top + 6, marginBottom: 6 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ alignSelf: 'flex-start' }}
              className="bg-white border border-outline-variant rounded-xl py-2 px-3 flex-row items-center gap-2"
            >
              <Ionicons name="arrow-back" size={18} color="#1B4332" />
              <Text className="text-primary font-bold text-xs">Retour</Text>
            </Pressable>
          </View>


          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingTop: insets.top + 12 }}>
            <View
              style={{ paddingHorizontal: horizontalPadding, marginBottom: verticalGap + 8 }}
              className="items-center"
            >
              <View className="relative mb-4 mt-5">
                <View
                  className="absolute -inset-3 rounded-full"
                  style={{ backgroundColor: '#012d1d', opacity: 0.08 }}
                />
                <Image
                  source={require('../../assets/images/lbaraka-light.png')}
                  style={{
                    width: isSmallScreen ? 50 : isMediumScreen ? 55 : 58,
                    height: isSmallScreen ? 50 : isMediumScreen ? 55 : 58,
                    borderRadius: (isSmallScreen ? 25 : isMediumScreen ? 27.5 : 30),
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>


          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingVertical: isSmallScreen ? 16 : 24,
            }}
          >

            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={{ marginBottom: verticalGap + 6 }}
            >
              <Text
                style={{
                  fontSize: isSmallScreen ? 26 : isMediumScreen ? 30 : 34,
                  fontFamily: 'Outfit',
                  fontWeight: '700',
                  color: '#012d1d',
                  lineHeight: isSmallScreen ? 30 : isMediumScreen ? 36 : 40,
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
                numberOfLines={2}
              >
                Bienvenue
              </Text>
              <Text
                style={{
                  fontSize: isSmallScreen ? 13 : 14,
                  fontFamily: 'Outfit',
                  fontWeight: '500',
                  color: '#66706b',
                  lineHeight: isSmallScreen ? 18 : 20,
                }}
              >
                Accédez à votre compte LBaraka et explorez les annonces disponibles
              </Text>
            </Animated.View>


            {error ? (
              <Animated.View
                entering={FadeInUp.duration(300)}
                style={{
                  backgroundColor: 'rgba(184, 34, 51, 0.08)',
                  borderLeftWidth: 4,
                  borderLeftColor: '#b82233',
                  padding: verticalGap,
                  borderRadius: 12,
                  marginBottom: verticalGap + 4,
                }}
              >
                <View className="flex-row gap-3 items-flex-start">
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color="#b82233"
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: isSmallScreen ? 12 : 13,
                      fontFamily: 'Outfit',
                      color: '#b82233',
                      fontWeight: '600',
                      flex: 1,
                      lineHeight: 18,
                    }}
                  >
                    {error}
                  </Text>
                </View>
              </Animated.View>
            ) : null}


            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 16,
                padding: verticalGap + 4,
                marginBottom: verticalGap + 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(1, 45, 29, 0.08)',
              }}
            >

              <View style={{ marginBottom: verticalGap }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Outfit',
                    fontWeight: '700',
                    color: '#012d1d',
                    letterSpacing: 1,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Adresse Email
                </Text>
                <View
                  style={{
                    height: inputHeight,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: 'rgba(1, 45, 29, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    gap: 10,
                    shadowColor: 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0,
                    shadowRadius: 8,
                    elevation: 0,
                  }}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#a5a6aa"
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nom@exemple.com"
                    placeholderTextColor="#a5a6aa"
                    keyboardType="email-address"
                    editable={!isLoading}
                    style={{
                      flex: 1,
                      fontSize: isSmallScreen ? 13 : 14,
                      fontFamily: 'Outfit',
                      color: '#012d1d',
                      padding: 0,
                    }}
                  />
                </View>
              </View>


              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Outfit',
                    fontWeight: '700',
                    color: '#012d1d',
                    letterSpacing: 1,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Mot de Passe
                </Text>
                <View
                  style={{
                    height: inputHeight,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: 'rgba(1, 45, 29, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    gap: 8,
                    shadowColor: 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0,
                    shadowRadius: 8,
                    elevation: 0,
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#a5a6aa"
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••"
                    placeholderTextColor="#a5a6aa"
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    style={{
                      flex: 1,
                      fontSize: isSmallScreen ? 13 : 14,
                      fontFamily: 'Outfit',
                      color: '#012d1d',
                      padding: 0,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    style={{ padding: 6 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#a5a6aa"
                    />
                  </Pressable>
                </View>
              </View>
            </Animated.View>


            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => ({
                  height: inputHeight + 8,
                  backgroundColor: '#012d1d',
                  borderRadius: 12,
                  overflow: 'hidden',
                  opacity: isLoading ? 0.7 : pressed ? 0.85 : 1,
                  shadowColor: '#012d1d',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  className="bg-gradient-to-r from-primary to-primary-container"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text
                        style={{
                          fontSize: isSmallScreen ? 14 : 15,
                          fontFamily: 'Outfit',
                          fontWeight: '700',
                          color: '#fff',
                          letterSpacing: 0.5,
                        }}
                      >
                        SE CONNECTER
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </View>
              </Pressable>
            </Animated.View>


            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: verticalGap + 6,
                gap: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: 'rgba(1, 45, 29, 0.1)',
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Outfit',
                  fontWeight: '700',
                  color: '#a5a6aa',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Nouveau Client?
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: 'rgba(1, 45, 29, 0.1)',
                }}
              />
            </View>


            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Pressable
                onPress={() => router.push('/(auth)/sign-up')}
                style={({ pressed }) => ({
                  paddingVertical: verticalGap - 2,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#012d1d',
                  backgroundColor: pressed ? 'rgba(1, 45, 29, 0.05)' : 'transparent',
                  opacity: isLoading ? 0.5 : 1,
                })}
                disabled={isLoading}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: isSmallScreen ? 13 : 14,
                    fontFamily: 'Outfit',
                    fontWeight: '700',
                    color: '#012d1d',
                    letterSpacing: 0.5,
                  }}
                >
                  CRÉER UN COMPTE
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


      <View
        style={{
          position: 'absolute',
          bottom: -60,
          left: -40,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#012d1d',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -40,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#fed65b',
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />
    </SafeAreaView>
  );
}
