import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { spacing, typography, radius } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { MainStackParamList } from '../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showProfileShortcut?: boolean;
}

export default function Header({
  title,
  subtitle,
  onBack,
  rightElement,
  showProfileShortcut = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, isLoggedIn } = useAuthStore();
  const { theme } = useTheme();

  const getInitials = () => {
    if (!user || !user.full_name) return 'U';
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: theme.headerBg,
          borderColor: theme.headerBorder,
        },
      ]}
    >
      <StatusBar
        barStyle={theme.statusBar === 'light' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.headerBg}
        translucent
      />

      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.backBtnBg,
                borderColor: theme.backBtnBorder,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.backBtnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>
          {rightElement ? (
            rightElement
          ) : showProfileShortcut && isLoggedIn ? (
            <TouchableOpacity
              onPress={handleProfilePress}
              style={styles.avatarBtn}
              activeOpacity={0.8}
            >
              {theme.mode === 'dark' && <View style={styles.avatarGlow} />}
              <View style={[
                styles.avatarInner,
                {
                  backgroundColor: theme.avatarBg,
                  borderColor: theme.avatarBorder,
                },
              ]}>
                <Text style={[styles.avatarText, { color: theme.mode === 'dark' ? '#FFFFFF' : theme.primary }]}>
                  {getInitials()}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    height: 44,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  backPlaceholder: { width: 38 },
  titleBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    ...typography.headingLg,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.bodySm,
    marginTop: 2,
    fontWeight: '500',
  },
  right: { width: 38, alignItems: 'flex-end', justifyContent: 'center' },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E53935',
    opacity: 0.25,
    zIndex: 1,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
