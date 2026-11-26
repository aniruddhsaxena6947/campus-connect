export interface CCTheme {
  isDark: boolean;
  bg: string;
  backdrop: string;
  surface: string;
  surfaceMuted: string;
  surfaceTag: string;
  surfaceElevated: string;
  sage: string;
  sageDeep: string;
  note: string;
  noteInk: string;
  primary: string;
  primaryBright: string;
  primaryFg: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  scrim: string;
  headerDarkBg: string;
  tabBarBg: string;
}

export const LIGHT_THEME: CCTheme = {
  isDark: false,
  bg: '#F4F1EA',
  backdrop: '#EAE6DC',
  surface: '#FAF8F3',
  surfaceMuted: '#EDE9DF',
  surfaceTag: '#E8DFCE',
  surfaceElevated: '#FFFFFF',
  sage: '#C8D2C2',
  sageDeep: '#95A592',
  note: '#E6D5B8',
  noteInk: '#2E261B',
  primary: '#1E3A2B',
  primaryBright: '#1E3A2B',
  primaryFg: '#FAF8F3',
  text: '#1C261F',
  textMuted: '#636D65',
  border: 'rgba(28, 38, 31, 0.10)',
  borderStrong: 'rgba(28, 38, 31, 0.22)',
  danger: '#B93829',
  dangerBg: 'rgba(185, 56, 41, 0.10)',
  success: '#1E5B3B',
  successBg: 'rgba(30, 91, 59, 0.12)',
  scrim: 'rgba(13, 25, 18, 0.62)',
  headerDarkBg: '#1E3A2B',
  tabBarBg: '#FAF8F3',
};

export const OLED_DARK_THEME: CCTheme = {
  isDark: true,
  bg: '#000000',
  backdrop: '#050706',
  surface: '#0C100E',
  surfaceMuted: '#141916',
  surfaceTag: '#181E1A',
  surfaceElevated: '#121814',
  sage: '#18261E',
  sageDeep: '#2A4234',
  note: '#252017',
  noteInk: '#E8D5B7',
  primary: '#244B37',
  primaryBright: '#78B894',
  primaryFg: '#F4F7F4',
  text: '#F3F4EE',
  textMuted: '#99A49C',
  border: 'rgba(255, 255, 255, 0.11)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
  danger: '#F07167',
  dangerBg: 'rgba(240, 113, 103, 0.14)',
  success: '#78B894',
  successBg: 'rgba(120, 184, 148, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.72)',
  headerDarkBg: '#12241A',
  tabBarBg: '#090C0A',
};

export const FONTS = {
  ui: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  handwritten: '"Kalam", "Caveat", cursive',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADII = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const TOUCH_TARGET = 44;
