export const colors = {
  primary: '#D32F2F',
  primaryDark: '#B71C1C',
  primaryLight: '#EF5350',

  background: '#0A0A0F',
  bgGradient: ['#050509', '#0A0A14', '#1A0709'] as const, // deep navy / black / subtle red glow gradient
  surface: '#12121A',
  card: '#181824',
  cardElevated: '#202030',
  border: '#242435',

  glass: 'rgba(16, 16, 24, 0.65)',
  glassElevated: 'rgba(24, 24, 36, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderActive: 'rgba(211, 47, 47, 0.45)',
  glowPrimary: 'rgba(211, 47, 47, 0.25)',

  text: '#FFFFFF',
  textSecondary: '#A5A9B8',
  textMuted: '#62667A',
  textInverse: '#050509',

  available: '#10B981',
  availableDim: 'rgba(16,185,129,0.15)',
  low: '#F59E0B',
  lowDim: 'rgba(245,158,11,0.15)',
  unavailable: '#EF4444',
  unavailableDim: 'rgba(239,68,68,0.15)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  displayLg: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
  displaySm: { fontSize: 22, fontWeight: '700' as const },
  headingLg: { fontSize: 20, fontWeight: '700' as const },
  headingMd: { fontSize: 18, fontWeight: '600' as const },
  headingSm: { fontSize: 16, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '400' as const },
  bodySm: { fontSize: 12, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.4 },
  label: { fontSize: 13, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.3 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};
