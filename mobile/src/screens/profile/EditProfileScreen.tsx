import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MainStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { authApi } from '../../api/auth';

type Nav = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

// @ts-ignore
const logoIcon = require('../../../assets/icon 4.png');

// ── Decorative blob + dots ─────────────────────────────────────────────────

function BlobDecor() {
  return <View style={styles.blobShape} />;
}

function DotsDecor() {
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push(
        <View key={`${row}-${col}`} style={[styles.dot, { top: row * 10, left: col * 10 }]} />
      );
    }
  }
  return <View style={styles.dotsContainer}>{dots}</View>;
}

// ── Field Label ────────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate] = useState(user?.governorate || 'Cairo');
  const [email] = useState(user?.email || 'user@example.com');
  const [uploading, setUploading] = useState(false);

  const getInitials = () => {
    if (!user?.full_name) return 'U';
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Edit Profile</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar Hero ── */}
          <View style={styles.heroCard}>
            <BlobDecor />
            <DotsDecor />

            {/* Avatar circle with gradient */}
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

            {/* Change Photo pill */}
            <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.75} onPress={handlePickAndUploadPhoto}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx={12} cy={13} r={4} />
              </Svg>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldBlock}>
              <FieldLabel label="Full Name" />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#BDBDBD"
                returnKeyType="next"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.fieldBlock}>
              <FieldLabel label="Phone Number" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* Governorate (non-editable) */}
            <View style={styles.fieldBlock}>
              <FieldLabel label="Governorate" />
              <TouchableOpacity style={styles.selectRow} activeOpacity={0.75} onPress={() => {}}>
                <Text style={styles.selectValue}>{governorate}</Text>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 9l6 6 6-6" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Email (disabled) */}
            <View style={styles.fieldBlock}>
              <FieldLabel label="Email Address" />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
                placeholderTextColor="#BDBDBD"
              />
              <View style={styles.lockRow}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
                  <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </Svg>
                <Text style={styles.lockText}>Cannot be changed</Text>
              </View>
            </View>
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => {}}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
              <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <Path d="M17 21v-8H7v8" />
              <Path d="M7 3v5h8" />
            </Svg>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  safe: { flex: 1 },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 22,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2341',
  },
  topBarSpacer: { width: 40 },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
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
    marginBottom: 24,
  },
  blobShape: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FCE4EC',
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
    backgroundColor: '#F8BBD9',
    opacity: 0.7,
  },

  // Avatar
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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

  // Change Photo
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#E53935',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  changePhotoText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Form ──
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A2341',
    fontWeight: '500',
  },
  inputDisabled: {
    color: '#9E9E9E',
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  selectRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 15,
    color: '#1A2341',
    fontWeight: '500',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  lockText: {
    fontSize: 12,
    color: '#9E9E9E',
  },

  // ── Save ──
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
