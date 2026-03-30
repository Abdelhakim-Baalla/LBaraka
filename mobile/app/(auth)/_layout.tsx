import { Stack } from "expo-router";
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '@/global.css';

export default function AuthLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [token, onboardingSeen] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('hasSeenOnboarding'),
      ]);

      setIsAuthenticated(!!token);
      setHasSeenOnboarding(onboardingSeen === 'true');
    } catch (error) {
      setIsAuthenticated(false);
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{headerShown:false}}/>;
}
