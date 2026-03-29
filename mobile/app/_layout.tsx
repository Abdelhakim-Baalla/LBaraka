import { Stack } from "expo-router";
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { usePathname, useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import '@/global.css';

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

export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
      options={{ 
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        captureAppLifecycleEvents: true
      }}
    >
      <ScreenTracker />
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(annonces)" options={{ headerShown: false }} />
        <Stack.Screen name="(points-relais)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </PostHogProvider>
  );
}
