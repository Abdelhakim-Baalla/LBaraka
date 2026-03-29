import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn } from '@clerk/expo';
import { Link, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async () => {
    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });
    
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl('/');
          if (url.startsWith('http')) {
            // @ts-ignore
            window.location.href = url;
          } else {
            router.push(url as Href);
          }
        },
      });
    } else if (signIn.status === 'needs_second_factor') {
      // Handle MFA if needed
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl('/');
          if (url.startsWith('http')) {
            // @ts-ignore
            window.location.href = url;
          } else {
            router.push(url as Href);
          }
        },
      });
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  // Verification screen
  if (signIn.status === 'needs_client_trust') {
    return (
      <View className="flex-1 bg-surface">
        {/* Header */}
        <View className="bg-white/70 backdrop-blur-xl shadow-lg px-6 h-16 flex-row items-center justify-between">
          <Pressable 
            onPress={() => signIn.reset()}
            className="w-10 h-10 rounded-xl items-center justify-center active:bg-primary-fixed/20"
          >
            <Ionicons name="arrow-back" size={24} color="#012d1d" />
          </Pressable>
          <Text className="text-xl font-bold tracking-widest text-primary">LBARAKA</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6 pt-24" showsVerticalScrollIndicator={false}>
          <View className="mb-10">
            <Text className="text-4xl font-bold text-primary leading-tight mb-3">
              Verify your account
            </Text>
            <Text className="text-lg text-on-surface-variant/80 leading-relaxed">
              We've sent a verification code to your email
            </Text>
          </View>

          <View className="space-y-5">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
                Verification Code
              </Text>
              <TextInput
                className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
                value={code}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#717973"
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.fields.code && (
                <Text className="text-error text-xs mt-2 ml-1">{errors.fields.code.message}</Text>
              )}
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={fetchStatus === 'fetching' || !code}
              className={`w-full bg-primary-container rounded-xl py-5 px-6 flex-row items-center justify-between shadow-lg ${
                (fetchStatus === 'fetching' || !code) ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-white font-bold text-lg tracking-wide">Verify</Text>
              {fetchStatus === 'fetching' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              )}
            </Pressable>

            <Pressable
              onPress={() => signIn.mfa.sendEmailCode()}
              className="py-4 items-center"
            >
              <Text className="text-secondary font-bold text-sm">I need a new code</Text>
            </Pressable>

            <Pressable
              onPress={() => signIn.reset()}
              className="py-4 items-center"
            >
              <Text className="text-secondary font-bold text-sm">Start over</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Sign-in form
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
            />
            {errors.fields.identifier && (
              <Text className="text-error text-xs mt-2 ml-1">{errors.fields.identifier.message}</Text>
            )}
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
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#717973" 
                />
              </Pressable>
            </View>
            {errors.fields.password && (
              <Text className="text-error text-xs mt-2 ml-1">{errors.fields.password.message}</Text>
            )}
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="flex-row items-center justify-between px-1">
            <Pressable 
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center gap-3"
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
          disabled={!email || !password || fetchStatus === 'fetching'}
          className={`w-full bg-primary-container rounded-xl py-5 px-6 flex-row items-center justify-between shadow-lg mt-8 ${
            (!email || !password || fetchStatus === 'fetching') ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">Enter the Riad</Text>
          {fetchStatus === 'fetching' ? (
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
