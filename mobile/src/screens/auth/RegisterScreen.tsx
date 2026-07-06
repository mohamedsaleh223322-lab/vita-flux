import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { governoratesApi } from '../../api/governorates';
import { useAuthStore } from '../../store/authStore';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { colors, spacing, typography, radius } from '../../theme';
import { AuthStackParamList, Governorate } from '../../types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

// @ts-ignore
const logoIcon = require('../../../assets/icon 4.png');

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[RegisterScreen] Fetching governorates...');
    governoratesApi.getAll()
      .then((data) => {
        console.log('[RegisterScreen] Governorates fetched successfully:', data);
        setGovernorates(data);
      })
      .catch((err) => {
        console.error('[RegisterScreen] Failed to fetch governorates:', err);
        if (err?.response) {
          console.error('[RegisterScreen] Governorates response error:', err.response.status, err.response.data);
        } else if (err?.request) {
          console.error('[RegisterScreen] Governorates request error (no response received):', err.request);
        } else {
          console.error('[RegisterScreen] Governorates error message:', err.message);
        }
      });
  }, []);

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required.';
    if (!phone.trim()) return 'Phone number is required.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      console.log('[RegisterScreen] Validation failed:', validationError);
      return;
    }
    setError('');
    setLoading(true);

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password,
      confirmPassword,
      governorateId: selectedGov?.id,
    };

    console.log('[RegisterScreen] Submitting registration payload:', {
      ...payload,
      password: '[REDACTED]',
      confirmPassword: '[REDACTED]'
    });

    try {
      const res = await authApi.register(payload);
      console.log('[RegisterScreen] Registration success response:', res);
      await login(res.token, res.user);
    } catch (err: any) {
      console.error('[RegisterScreen] Registration error caught:', err);
      let errorMsg = 'Registration failed. Please try again.';
      
      if (err?.response) {
        console.error('[RegisterScreen] Backend error response:', err.response.status, err.response.data);
        errorMsg = err.response.data?.message || `Server Error: ${err.response.status}`;
      } else if (err?.request) {
        console.error('[RegisterScreen] Network error, no response:', err.request);
        errorMsg = 'Network error. Cannot reach server. Please check your connection and ensure the backend is running.';
      } else {
        console.error('[RegisterScreen] Axios setup error:', err.message);
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.header}>
            <View style={styles.logoBox}>
              <Image source={logoIcon} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join the network</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <AppInput
              label="Full Name"
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              containerStyle={{ marginTop: error ? spacing.lg : 0 }}
            />
            <AppInput
              label="Phone Number"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <AppInput
              label="Email (optional)"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label="Password"
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              isPassword
            />
            <AppInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
            />

            {/* Governorate Picker */}
            <Text style={styles.pickerLabel}>Governorate</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowGovPicker((v) => !v)}
            >
              <Text style={selectedGov ? styles.pickerSelected : styles.pickerPlaceholder}>
                {selectedGov ? selectedGov.name : 'Select your governorate'}
              </Text>
              <Text style={styles.pickerArrow}>{showGovPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showGovPicker && (
              <View style={styles.govList}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                  {governorates.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.govItem,
                        selectedGov?.id === g.id && styles.govItemActive,
                      ]}
                      onPress={() => {
                        setSelectedGov(g);
                        setShowGovPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.govItemText,
                          selectedGov?.id === g.id && styles.govItemTextActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                      {selectedGov?.id === g.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <AppButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    overflow: 'hidden',
  },
  logoImg: { width: 60, height: 60 },
  appName: { ...typography.displaySm, color: colors.text },
  tagline: {
    ...typography.caption, color: colors.primary, letterSpacing: 2,
    textTransform: 'uppercase', marginTop: 4,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,23,68,0.12)', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1,
    borderColor: `${colors.unavailable}40`,
  },
  errorText: { ...typography.bodyMd, color: colors.unavailable },
  pickerLabel: {
    ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, height: 52,
    paddingHorizontal: spacing.lg, borderWidth: 1.5, borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  pickerSelected: { ...typography.bodyLg, color: colors.text },
  pickerPlaceholder: { ...typography.bodyLg, color: colors.textMuted },
  pickerArrow: { color: colors.textSecondary, fontSize: 12 },
  govList: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, marginBottom: spacing.lg, overflow: 'hidden',
  },
  govItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  govItemActive: { backgroundColor: `${colors.primary}15` },
  govItemText: { ...typography.bodyMd, color: colors.text },
  govItemTextActive: { color: colors.primary, fontWeight: '700' },
  checkmark: { color: colors.primary, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.bodyMd, color: colors.textSecondary },
  footerLink: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
});
