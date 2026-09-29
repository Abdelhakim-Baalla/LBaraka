import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { PressableScale } from '@/components/ui/PressableScale';

const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconOut: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'Accueil', icon: 'home', iconOut: 'home-outline' },
  { name: 'map', label: 'Carte', icon: 'map', iconOut: 'map-outline' },
  { name: 'food-rescue', label: 'Food Rescue', icon: 'restaurant', iconOut: 'restaurant-outline' },
  { name: 'transactions', label: 'Transactions', icon: 'receipt', iconOut: 'receipt-outline' },
  { name: 'chat', label: 'Messages', icon: 'chatbubble', iconOut: 'chatbubble-outline' },
  { name: 'wallet', label: 'Wallet', icon: 'wallet', iconOut: 'wallet-outline' },
  { name: 'profile', label: 'Profil', icon: 'person', iconOut: 'person-outline' },
];

function FloatingBar({ state, navigation }: BottomTabBarProps) {
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: insets.bottom + 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? 'rgba(32, 26, 22, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderRadius: 26,
        borderWidth: 1,
        borderColor: c.line,
        paddingHorizontal: 8,
        paddingVertical: 8,
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: mode === 'dark' ? 0.5 : 0.14,
        shadowRadius: 28,
        elevation: 12,
      }}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
        return (
          <PressableScale
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 18,
              backgroundColor: focused ? c.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={focused ? tab.icon : tab.iconOut}
              size={22}
              color={focused ? c.onPrimary : c.muted}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

function AuthedTabs() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Tabs
        tabBar={(props) => <FloatingBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} />
        ))}
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  const { c } = useTheme();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      setHasToken(!!token);
    } catch {
      setHasToken(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <AuthedTabs />;
}
