import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#1b4332" />
      </View>
    );
  }
  
  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return <Redirect href="/(auth)/sign-in" />;
}
