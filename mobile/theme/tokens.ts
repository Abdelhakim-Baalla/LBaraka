// LBaraka v2 identity: "Terracotta & Ink"
// Warm premium palette. One accent (clay) everywhere. Off-blacks and
// off-whites only, never pure #000 / #fff surfaces in dark mode.
export type ThemeMode = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  primary: string;
  primaryDeep: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  gold: string;
  goldSoft: string;
  onGoldSoft: string;
  success: string;
  successSoft: string;
  onSuccessSoft: string;
  danger: string;
  dangerSoft: string;
  onDangerSoft: string;
  info: string;
  infoSoft: string;
  onInfoSoft: string;
  shadow: string;
  overlay: string;
}

const light: Palette = {
  bg: '#FAF6F0',
  surface: '#FFFFFF',
  surface2: '#F2EBDF',
  ink: '#221A13',
  ink2: '#4A3F34',
  muted: '#8A7B6B',
  line: '#E8DCC9',
  primary: '#BC4B1F',
  primaryDeep: '#973811',
  onPrimary: '#FFFFFF',
  primarySoft: '#F8E2D0',
  onPrimarySoft: '#8A3411',
  gold: '#B8862E',
  goldSoft: '#F6E8C8',
  onGoldSoft: '#7A5A17',
  success: '#2E7D4F',
  successSoft: '#DCEFE2',
  onSuccessSoft: '#1C5C37',
  danger: '#B3261E',
  dangerSoft: '#F9DEDB',
  onDangerSoft: '#8C1D17',
  info: '#2F6FED',
  infoSoft: '#DEE9FE',
  onInfoSoft: '#1E4FBE',
  shadow: '#2A1A08',
  overlay: 'rgba(24, 14, 6, 0.55)',
};

const dark: Palette = {
  bg: '#151110',
  surface: '#201A16',
  surface2: '#2B231C',
  ink: '#F5EDE1',
  ink2: '#D8C9B6',
  muted: '#A89885',
  line: '#3B3129',
  primary: '#E4703A',
  primaryDeep: '#C85A28',
  onPrimary: '#231104',
  primarySoft: '#4A2410',
  onPrimarySoft: '#F2B48C',
  gold: '#D9A441',
  goldSoft: '#4A3A16',
  onGoldSoft: '#EBCB7E',
  success: '#5DB87F',
  successSoft: '#143A26',
  onSuccessSoft: '#9FE0B8',
  danger: '#E5736B',
  dangerSoft: '#4A1A15',
  onDangerSoft: '#F2A9A2',
  info: '#7DA6F5',
  infoSoft: '#1B2C55',
  onInfoSoft: '#B9CFFB',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const palettes: Record<ThemeMode, Palette> = { light, dark };

// Single radius system: soft geometric. Pills reserved for chips and tags.
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

// Outfit everywhere. Loaded via @expo-google-fonts/outfit in root layout.
export const fontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

export const type = {
  display: { size: 30, lh: 36, family: fontFamily.bold, ls: -0.5 },
  h1: { size: 23, lh: 29, family: fontFamily.bold, ls: -0.3 },
  h2: { size: 19, lh: 25, family: fontFamily.semibold, ls: -0.2 },
  h3: { size: 16, lh: 22, family: fontFamily.semibold, ls: 0 },
  body: { size: 14, lh: 21, family: fontFamily.regular, ls: 0 },
  bodyStrong: { size: 14, lh: 21, family: fontFamily.semibold, ls: 0 },
  small: { size: 12, lh: 18, family: fontFamily.regular, ls: 0 },
  caption: { size: 11, lh: 15, family: fontFamily.medium, ls: 0.4 },
  overline: { size: 10, lh: 14, family: fontFamily.semibold, ls: 1.4 },
} as const;

export function shadowSm(mode: ThemeMode) {
  return {
    shadowColor: palettes[mode].shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: mode === 'dark' ? 0.5 : 0.08,
    shadowRadius: 8,
    elevation: 2,
  };
}

export function shadowMd(mode: ThemeMode) {
  return {
    shadowColor: palettes[mode].shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: mode === 'dark' ? 0.55 : 0.1,
    shadowRadius: 24,
    elevation: 5,
  };
}
