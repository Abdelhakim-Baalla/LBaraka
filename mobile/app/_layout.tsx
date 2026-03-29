import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import '@/global.css';

export default function RootLayout() {
  // Check if user is authenticated - for now redirect to tabs
  const isAuthenticated = false; // TODO: implement auth check

  return (
    <>
      <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(annonces)" options={{ headerShown: false }} />
        <Stack.Screen name="(points-relais)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
