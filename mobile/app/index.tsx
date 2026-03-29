import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Check if user is authenticated
  const isAuthenticated = true; // Change to false to go to auth
  
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return <Redirect href="/(auth)/sign-in" />;
}
