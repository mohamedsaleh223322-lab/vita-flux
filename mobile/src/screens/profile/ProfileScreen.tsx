import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useGovernorateStore } from '../../store/governorateStore';
import { MainStackParamList } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { authApi } from '../../api/auth';
import { useTheme, AppTheme } from '../../context/ThemeContext';

// @ts-ignore
const logoIcon = require('../../../assets/icon 4.png');

type Nav = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

// ── Theme-aware color palette ─────────────────────────────────────────────────

function palette(t: AppTheme) {
  const dark = t.mode === 'dark';
  return {
    screenBg:       dark ? '#111111' : '#F4F6F9',
    topBarBg:       dark ? '#1C1C1E' : '#FFFFFF',
    topBarBorder:   dark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    heroBg:         dark ? '#1C1C1E' : '#FFFFFF',
    infoBg:         dark ? '#1C1C1E' : '#FFFFFF',
    headingText:    dark ? '#FFFFFF' : '#1A2341',
    bodyText:       dark ? '#A5A9B8' : '#6B7280',
    valueText:      dark ? '#FFFFFF' : '#1A2341',
    chevronText:    dark ? '#62667A' : '#9CA3AF',
    brandVita:      dark ? '#FFFFFF' : '#1A2341',
    brandSub:       dark ? '#62667A' : '#9E9E9E',
    separator:      dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    sectionDivider: dark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    iconCircleBg:   dark ? 'rgba(229,57,53,0.12)' : '#FCE4EC',
    blobBg:         dark ? 'rgba(229,57,53,0.10)' : '#FCE4EC',
    dotBg:          dark ? 'rgba(229,57,53,0.20)' : '#F8BBD9',
    badgeBg:        dark ? 'rgba(229,57,53,0.14)' : '#FCE4EC',
    toggleBg:       dark ? '#2C2C2E' : '#F2F2F7',
    toggleBorder:   dark ? 'rgba(255,255,255,0.10)' : '#E0E0E0',
    toggleText:     dark ? '#A5A9B8' : '#555555',
    toggleIcon:     dark ? '#FFFFFF' : '#555555',
    logoBoxBg:      dark ? '#2C2C2E' : '#FFFFFF',
  };
}

// ── Top Bar ───────────────────────────────────────────────────────────────────

function TopBar({
  isDark,
  toggleTheme,
  p,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  p: ReturnType<typeof palette>;
}) {
  return (
    <View style={[styles.topBar, { backgroundColor: p.topBarBg, borderBottomColor: p.topBarBorder }]}>
      {/* Left: Logo + Brand */}
      <View style={styles.topBarLeft}>
        <View style={[styles.logoBox, { backgroundColor: p.logoBoxBg }]}>
          <Image source={logoIcon} style={styles.logoImg} resizeMode="contain" />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.brandRow}>
            <Text style={[styles.brandVita, { color: p.brandVita }]}>VITA </Text>
            <Text style={styles.brandFlux}>FLUX</Text>
          </Text>
          <Text style={[styles.brandSub, { color: p.brandSub }]}>Blood Inventory</Text>
        </View>
      </View>

      {/* Right: Dark Mode Toggle */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: p.toggleBg, borderColor: p.toggleBorder }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={15} color={p.toggleIcon} />
        <Text style={[styles.themeText, { color: p.toggleText }]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          thumbColor="#fff"
          trackColor={{ false: '#D9D9D9', true: '#E53935' }}
          style={styles.themeSwitch}
        />
      </TouchableOpacity>
    </View>
  );
}

// ── Decorative blob + dots ────────────────────────────────────────────────────

function BlobDecor({ p }: { p: ReturnType<typeof palette> }) {
  return <View style={[styles.blobShape, { backgroundColor: p.blobBg }]} />;
}

function DotsDecor({ p }: { p: ReturnType<typeof palette> }) {
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push(
        <View
          key={`${row}-${col}`}
          style={[styles.dot, { top: row * 10, left: col * 10, backgroundColor: p.dotBg }]}
        />,
      );
    }
  }
  return <View style={styles.dotsContainer}>{dots}</View>;
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
  p,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
  p: ReturnType<typeof palette>;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={[styles.infoIconCircle, { backgroundColor: p.iconCircleBg }]}>{icon}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.infoLabel, { color: p.bodyText }]}>{label}</Text>
        </View>
        <View style={styles.infoValueRow}>
          <Text style={[styles.infoValue, { color: p.valueText }]} numberOfLines={1}>
            {value}
          </Text>
          <Text style={[styles.infoChevron, { color: p.chevronText }]}>{'>'}</Text>
        </View>
      </View>
      {!isLast && <View style={[styles.infoSeparator, { backgroundColor: p.separator }]} />}
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, updateUser } = useAuthStore();
  const { selected } = useGovernorateStore();
  const [uploading, setUploading] = useState(false);

  const { theme, isDark, toggleTheme } = useTheme();
  const p = palette(theme);

  const handleLogout = async () => {
    await logout();
  };

  const handlePickAndUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant gallery permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const selectedAsset = result.assets[0];
    const imageUri = selectedAsset.uri;

    setUploading(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      });

      const uploadResult = await authApi.uploadAvatar(formData);
      await updateUser({ avatar_url: uploadResult.avatarUrl });
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const getInitials = () => {
    if (!user.full_name) return 'U';
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const displayGovernorate = user.governorate || selected?.name || 'Not Selected';

  return (
    <View style={[styles.container, { backgroundColor: p.screenBg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar isDark={isDark} toggleTheme={toggleTheme} p={p} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Hero Card ── */}
          <View style={[styles.heroCard, { backgroundColor: p.heroBg }]}>
            <BlobDecor p={p} />
            <DotsDecor p={p} />

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <>
                  <Svg width={100} height={100} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <LinearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#C62828" />
                        <Stop offset="100%" stopColor="#E53935" />
                      </LinearGradient>
                    </Defs>
                    <Circle cx={50} cy={50} r={50} fill="url(#avatarGrad)" />
                  </Svg>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </>
              )}

              {/* Uploading loading overlay spinner */}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}

              {/* Camera badge */}
              <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8} onPress={handlePickAndUploadPhoto}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx={12} cy={13} r={4} />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={[styles.heroName, { color: p.headingText }]}>{user.full_name}</Text>

            {/* Blood Recipient badge */}
            <View style={[styles.recipientBadge, { backgroundColor: p.badgeBg }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <Path d="M9 12l2 2 4-4" />
              </Svg>
              <Text style={styles.recipientText}>Blood Recipient</Text>
            </View>

            {/* Edit Profile */}
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.75} onPress={() => navigation.navigate('EditProfile')}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </Svg>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Personal Information ── */}
          <View style={styles.sectionHeaderRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <Circle cx={12} cy={7} r={4} />
            </Svg>
            <Text style={[styles.sectionTitle, { color: p.headingText }]}>Personal Information</Text>
            <View style={[styles.sectionDivider, { backgroundColor: p.sectionDivider }]} />
          </View>

          <View style={[styles.infoCard, { backgroundColor: p.infoBg }]}>
            <InfoRow
              label="Full Name"
              value={user.full_name}
              p={p}
              icon={
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <Circle cx={12} cy={7} r={4} />
                </Svg>
              }
            />
            <InfoRow
              label="Email Address"
              value={user.email || 'Not Registered'}
              p={p}
              icon={
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" />
                </Svg>
              }
            />
            <InfoRow
              label="Phone Number"
              value={user.phone}
              p={p}
              icon={
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </Svg>
              }
            />
            <InfoRow
              label="Governorate"
              value={displayGovernorate}
              isLast
              p={p}
              icon={
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <Circle cx={12} cy={10} r={3} />
                </Svg>
              }
            />
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
              <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <Path d="M16 17l5-5-5-5" />
              <Path d="M21 12H9" />
            </Svg>
            <Text style={styles.logoutText}>Logout from Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImg: { width: 32, height: 32 },
  brandRow: { lineHeight: 20 },
  brandVita: { fontSize: 16, fontWeight: '800' },
  brandFlux: { fontSize: 16, fontWeight: '800', color: '#E53935' },
  brandSub: { fontSize: 11, marginTop: 1 },

  // ── Dark Mode Toggle Pill ──
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 4,
    borderWidth: 1,
    gap: 5,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeSwitch: {
    transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }],
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  blobShape: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.6,
  },
  dotsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 50,
    height: 50,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },

  // Avatar
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'visible',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    zIndex: 1,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'absolute',
  },
  uploadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 4,
  },

  heroName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Badge
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
  },
  recipientText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '700',
  },

  // Edit button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E53935',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 9,
    width: 180,
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Section Header ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
  },

  // ── Info Card ──
  infoCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 130,
    textAlign: 'right',
  },
  infoChevron: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSeparator: {
    height: 1,
    marginHorizontal: 0,
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
