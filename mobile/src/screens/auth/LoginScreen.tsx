import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { colors, spacing, typography, radius } from '../../theme';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      setError('Please enter your phone number and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ phone: phone.trim(), password });
      await login(res.token, res.user);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Dark Mode Toggle */}
      <View style={styles.themeToggleContainer}>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={18}
            color={isDark ? '#fff' : '#666'}
          />
          <Text style={styles.themeText}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor="#fff"
            trackColor={{ false: '#D9D9D9', true: '#E53935' }}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🩸</Text>
            </View>
            <Text style={styles.appName}>VitaFlux</Text>
            <Text style={styles.tagline}>Blood Bank Network</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <AppInput
              label="Phone Number"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              containerStyle={{ marginTop: spacing.lg }}
            />

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  themeToggleContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  themeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}50`,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  appName: { ...typography.displaySm, color: colors.text },
  tagline: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { ...typography.headingLg, color: colors.text, marginBottom: 4 },
  cardSubtitle: { ...typography.bodyMd, color: colors.textSecondary },
  errorBanner: {
    backgroundColor: 'rgba(255,23,68,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.unavailable}40`,
  },
  errorText: { ...typography.bodyMd, color: colors.unavailable },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: { ...typography.bodyMd, color: colors.textSecondary },
  footerLink: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
});
