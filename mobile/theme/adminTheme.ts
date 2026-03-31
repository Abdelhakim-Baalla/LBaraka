// Thème Admin inspiré du design Executive Command Center
// Utilisable dans toutes les pages admin React Native/Expo

export const adminTheme = {
  colors: {
    background: '#131313',
    surface: '#201f1f',
    surfaceContainer: '#353534',
    surfaceContainerHigh: '#2a2a2a',
    surfaceContainerLowest: '#0e0e0e',
    surfaceVariant: '#353534',
    surfaceBright: '#3a3939',
    surfaceDim: '#131313',
    primary: '#c0c1ff',
    primaryContainer: '#8083ff',
    onPrimary: '#1000a9',
    onPrimaryContainer: '#0d0096',
    secondary: '#adc6ff',
    secondaryContainer: '#0566d9',
    onSecondary: '#002e6a',
    onSecondaryContainer: '#e6ecff',
    tertiary: '#ffb783',
    tertiaryContainer: '#d97721',
    onTertiary: '#4f2500',
    onTertiaryContainer: '#452000',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    onErrorContainer: '#ffdad6',
    outline: '#908fa0',
    outlineVariant: '#464554',
    onSurface: '#e5e2e1',
    onSurfaceVariant: '#c7c4d7',
    inverseSurface: '#e5e2e1',
    inversePrimary: '#494bd6',
    border: '#464554',
    cardBorder: '#46455433',
    cardShadow: '#00000033',
    badge: '#ffb783',
    badgeText: '#452000',
    success: '#4ade80',
    warning: '#ffb783',
    info: '#adc6ff',
    danger: '#ffb4ab',
  },
  fonts: {
    headline: 'Plus Jakarta Sans',
    body: 'Outfit',
    label: 'Outfit',
    inter: 'Inter',
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 32,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  gradients: {
    primary: ['#c0c1ff', '#8083ff'],
  },
};

// Utilisation :
// import { adminTheme } from '../../theme/adminTheme';
// style={{ backgroundColor: adminTheme.colors.background }}
// textStyle={{ color: adminTheme.colors.onSurface, fontFamily: adminTheme.fonts.body }}
