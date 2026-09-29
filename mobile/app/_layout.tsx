import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { usePathname } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

function ScreenTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname) {
      posthog?.screen(pathname);
    }
  }, [pathname]);

  return null;
}

function Nav() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'ios_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(annonces)" options={{ headerShown: false }} />
        <Stack.Screen name="(points-relais)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF6F0' }}>
        <ActivityIndicator size="large" color="#BC4B1F" />
      </View>
    );
  }

  // Analytics PostHog : opt-in. Sans cle API, l'app tourne sans tracking.
  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  const content = (
    <ThemeProvider>
      <Nav />
    </ThemeProvider>
  );

  if (!posthogApiKey) {
    return content;
  }

  return (
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        captureAppLifecycleEvents: true,
      }}
    >
      <ScreenTracker />
      {content}
    </PostHogProvider>
  );
}
