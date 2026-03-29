import { Stack } from "expo-router";
import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import '@/global.css';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{headerShown:false}}/>;
}
