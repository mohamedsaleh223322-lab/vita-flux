import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Color tokens ───────────────────────────────────────────────────────────

export const darkTheme = {
  mode: 'dark' as 'dark' | 'light',
  // Backgrounds
  background: '#111111',
  surface: '#1C1C1E',
  card: '#1C1C1E',
  // Text
  text: '#FFFFFF',
  textSecondary: '#A5A9B8',
  textMuted: '#62667A',
  // Borders & dividers
  border: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.06)',
  // Icon backgrounds
  iconBg: 'rgba(255,255,255,0.03)',
  iconBorder: 'rgba(255,255,255,0.08)',
  // Accent
  primary: '#E53935',
  // Header
  headerBg: '#111111',
  headerBorder: 'rgba(255,255,255,0.06)',
  // Nav bar
  navBg: '#111111',
  navBorder: 'rgba(255,255,255,0.06)',
  // Back button
  backBtnBg: 'rgba(16, 16, 24, 0.65)',
  backBtnBorder: 'rgba(255, 255, 255, 0.08)',
  backBtnIcon: '#FFFFFF',
  // Avatar
  avatarBg: 'rgba(211, 47, 47, 0.12)',
  avatarBorder: 'rgba(211, 47, 47, 0.4)',
  // Status bar style
  statusBar: 'light' as 'dark' | 'light',
  // Glass row
  glassRowBg: 'rgba(16, 16, 24, 0.65)',
  glassRowBorder: 'rgba(255, 255, 255, 0.08)',
  // Logout button
  logoutBg: 'rgba(239, 68, 68, 0.15)',
  logoutBorder: 'rgba(239, 68, 68, 0.4)',
  logoutText: '#EF4444',
  // Theme toggle button
  toggleBg: '#2C2C2E',
  toggleBorder: 'rgba(255,255,255,0.1)',
  // Info card (hospital detail)
  infoCardBg: '#1C1C1E',
  infoDivider: 'rgba(255,255,255,0.06)',
  // Inventory legend pill
  legendPillBg: '#1C1C1E',
  // Status card
  statusCardBg: '#1C1C1E',
  // Gov card
  govCardBg: '#1C1C1E',
  govCardActiveBg: 'rgba(229, 57, 53, 0.08)',
  govCardActiveBorder: 'rgba(229, 57, 53, 0.3)',
  govNameColor: '#A5A9B8',
  // Hospital row
  hospitalRowBg: '#1C1C1E',
  hospitalRowNameColor: '#FFFFFF',
  // HospitalDetail hero
  heroBg: '#1C1C1E',
  heroNameColor: '#FFFFFF',
  // HospitalDetail back btn
  detailBackBtnBg: '#1C1C1E',
  // Inventory summary card
  inventorySummaryCardBg: '#1C1C1E',
  invDivider: 'rgba(255,255,255,0.06)',
  // CTA buttons
  callOutlineBorder: 'rgba(255,255,255,0.12)',
  callOutlineText: '#A5A9B8',
  // Continue button disabled
  continueBtnDisabledBg: '#1C1C1E',
  continueBtnDisabledBorder: 'rgba(255,255,255,0.08)',
  // Retry button
  retryBtnBg: '#1C1C1E',
  // HospitalTab icon wrap
  hospitalTabIconWrapBg: '#1C1C1E',
  // Search bar
  searchBg: '#1C1C1E',
  searchBorder: 'rgba(255,255,255,0.08)',
  searchText: '#FFFFFF',
  searchPlaceholder: '#62667A',
  // Stat numbers
  statNumberColor: '#FFFFFF',
};

export const lightTheme = {
  mode: 'light' as 'dark' | 'light',
  // Backgrounds
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  // Text
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#888888',
  // Borders & dividers
  border: '#E0E0E0',
  divider: '#E0E0E0',
  // Icon backgrounds
  iconBg: 'rgba(229,57,53,0.08)',
  iconBorder: 'rgba(229,57,53,0.2)',
  // Accent
  primary: '#E53935',
  // Header
  headerBg: '#FFFFFF',
  headerBorder: '#E0E0E0',
  // Nav bar
  navBg: '#FFFFFF',
  navBorder: '#E0E0E0',
  // Back button
  backBtnBg: '#F2F2F7',
  backBtnBorder: '#E0E0E0',
  backBtnIcon: '#111111',
  // Avatar
  avatarBg: 'rgba(229,57,53,0.08)',
  avatarBorder: '#E53935',
  // Status bar style
  statusBar: 'dark' as 'dark' | 'light',
  // Glass row
  glassRowBg: '#FFFFFF',
  glassRowBorder: '#E0E0E0',
  // Logout button
  logoutBg: '#E53935',
  logoutBorder: '#E53935',
  logoutText: '#FFFFFF',
  // Theme toggle button
  toggleBg: '#FFFFFF',
  toggleBorder: '#E0E0E0',
  // Info card (hospital detail)
  infoCardBg: '#FFFFFF',
  infoDivider: '#E0E0E0',
  // Inventory legend pill
  legendPillBg: '#FFFFFF',
  // Status card
  statusCardBg: '#FFFFFF',
  // Gov card
  govCardBg: '#FFFFFF',
  govCardActiveBg: 'rgba(229, 57, 53, 0.06)',
  govCardActiveBorder: 'rgba(229, 57, 53, 0.35)',
  govNameColor: '#555555',
  // Hospital row
  hospitalRowBg: '#FFFFFF',
  hospitalRowNameColor: '#111111',
  // HospitalDetail hero
  heroBg: '#FFFFFF',
  heroNameColor: '#111111',
  // HospitalDetail back btn
  detailBackBtnBg: '#F2F2F7',
  // Inventory summary card
  inventorySummaryCardBg: '#FFFFFF',
  invDivider: '#E0E0E0',
  // CTA buttons
  callOutlineBorder: '#E0E0E0',
  callOutlineText: '#555555',
  // Continue button disabled
  continueBtnDisabledBg: '#FFFFFF',
  continueBtnDisabledBorder: '#E0E0E0',
  // Retry button
  retryBtnBg: '#FFFFFF',
  // HospitalTab icon wrap
  hospitalTabIconWrapBg: '#FFFFFF',
  // Search bar
  searchBg: '#FFFFFF',
  searchBorder: '#E0E0E0',
  searchText: '#111111',
  searchPlaceholder: '#888888',
  // Stat numbers
  statNumberColor: '#111111',
};

export type AppTheme = typeof darkTheme;

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@app_theme_mode';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light') setIsDark(false);
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}
