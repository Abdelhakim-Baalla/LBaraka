import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function AdminLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user-details" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="annonces" />
    </Stack>
  );
}
