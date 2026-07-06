import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Rect } from 'react-native-svg';
import { hospitalsApi } from '../../api/hospitals';
import { favoritesApi } from '../../api/favorites';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme';
import { Hospital, MainStackParamList } from '../../types';

// @ts-ignore
const logoIcon = require('../../../assets/icon 4.png');

type Nav = NativeStackNavigationProp<MainStackParamList, 'HospitalDetail'>;
type Route = RouteProp<MainStackParamList, 'HospitalDetail'>;

// ── Loading / Error skeleton ───────────────────────────────────────────────

function SimpleHeader({ onBack, onShare }: { onBack: () => void; onShare?: () => void }) {
  return (
    <View style={styles.topBar}>
      {/* Back */}
      <TouchableOpacity style={styles.topBarBtn} onPress={onBack} activeOpacity={0.7}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 12H5"/><Path d="M12 19l-7-7 7-7"/>
        </Svg>
      </TouchableOpacity>

      {/* Brand center */}
      <View style={styles.topBarCenter}>
        <Image source={logoIcon} style={styles.topBarLogo} resizeMode="contain" />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.topBarBrand}>
            <Text style={styles.brandVita}>VITA </Text>
            <Text style={styles.brandFlux}>FLUX</Text>
          </Text>
          <Text style={styles.topBarSub}>Smart Stock. Better Care.</Text>
        </View>
      </View>

      {/* Share */}
      <TouchableOpacity style={styles.topBarBtn} onPress={onShare} activeOpacity={0.7}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={18} cy={5} r={3}/><Circle cx={6} cy={12} r={3}/><Circle cx={18} cy={19} r={3}/>
          <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function HospitalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { hospitalId } = route.params;
  const { isLoggedIn } = useAuthStore();
  const { isFavorite, addLocal, removeLocal } = useFavoritesStore();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await hospitalsApi.getById(hospitalId);
      setHospital(data);
    } catch {
      Alert.alert('Error', 'Could not load hospital details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const callHospital = () => {
    if (!hospital?.phone) return;
    const tel = `tel:${hospital.phone.replace(/\s/g, '')}`;
    Linking.canOpenURL(tel).then((can) => {
      if (can) Linking.openURL(tel);
      else Alert.alert('Error', 'Unable to open the dialer.');
    });
  };

  const handleShare = async () => {
    if (!hospital) return;
    try {
      await Share.share({ message: `${hospital.name} — ${hospital.address} — ${hospital.phone}` });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <SimpleHeader onBack={() => navigation.goBack()} />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#E53935" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!hospital) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <SimpleHeader onBack={() => navigation.goBack()} />
          <View style={styles.center}>
            <Text style={{ color: '#6B7280', fontSize: 15 }}>Hospital not found.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const hasImage = !!hospital.imageUrl;
  const hasStock = hospital.stockStatus === 'available';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Top Bar ── */}
        <SimpleHeader onBack={() => navigation.goBack()} onShare={handleShare} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#E53935" />
          }
        >

          {/* ── Hospital Banner Card ── */}
          <Animated.View entering={FadeInUp.duration(450)} style={styles.bannerCard}>
            {/* Image */}
            <View style={styles.bannerImage}>
              {hasImage ? (
                <Image source={{ uri: hospital.imageUrl! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={styles.bannerImagePlaceholder}>
                  <Image source={logoIcon} style={styles.placeholderIcon} resizeMode="contain" />
                </View>
              )}
            </View>

            {/* Banner bottom info */}
            <View style={styles.bannerInfo}>
              {/* Building icon */}
              <View style={styles.bannerIconBox}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 21h18"/><Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                  <Path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/>
                  <Path d="M10 10h4"/><Path d="M12 8v4"/>
                </Svg>
              </View>

              {/* Name + location */}
              <View style={styles.bannerTextBlock}>
                <Text style={styles.bannerName} numberOfLines={2}>{hospital.name}</Text>
                <View style={styles.bannerLocRow}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle cx={12} cy={10} r={3}/>
                  </Svg>
                  <Text style={styles.bannerLocation} numberOfLines={1}>{hospital.address}, {hospital.governorate}</Text>
                </View>
              </View>

              {/* Stock badge */}
              <View style={[styles.stockBadge, hasStock ? styles.stockBadgeAvailable : styles.stockBadgeUnavailable]}>
                <View style={[styles.stockDot, { backgroundColor: hasStock ? '#16A34A' : '#EF4444' }]} />
                <Text style={[styles.stockBadgeText, { color: hasStock ? '#16A34A' : '#EF4444' }]}>
                  {hasStock ? 'Stock\nAvailable' : 'No Stock'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Hospital Information Card ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </Svg>
              <Text style={styles.cardHeaderTitle}>Hospital Information</Text>
            </View>
            <View style={styles.cardDivider} />

            {/* Address row */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowIcon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle cx={12} cy={10} r={3}/>
                </Svg>
              </View>
              <View style={styles.infoRowContent}>
                <Text style={styles.infoRowLabel}>Address</Text>
                <Text style={styles.infoRowValue}>{hospital.address}</Text>
              </View>
            </View>
            <View style={styles.cardDivider} />

            {/* Phone row */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowIcon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </Svg>
              </View>
              <View style={styles.infoRowContent}>
                <Text style={styles.infoRowLabel}>Phone Number</Text>
                <Text style={styles.infoRowValue}>{hospital.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callCircleBtn} onPress={callHospital} activeOpacity={0.75}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.cardDivider} />

            {/* Working hours row */}
            <View style={styles.infoRow}>
              <View style={styles.infoRowIcon}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10}/><Path d="M12 6v6l4 2"/>
                </Svg>
              </View>
              <View style={styles.infoRowContent}>
                <Text style={styles.infoRowLabel}>Working Hours</Text>
              </View>
              {hospital.open24Hours ? (
                <View style={styles.open24Badge}>
                  <Text style={styles.open24Text}>✓ Open 24 Hours</Text>
                </View>
              ) : (
                <Text style={styles.hoursText}>{hospital.openingTime} - {hospital.closingTime}</Text>
              )}
            </View>
          </Animated.View>

          {/* ── Blood Inventory Card ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.inventoryCard}>
            <View style={styles.cardHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2L8 9H5l-3 3 3 3h3l4 7 4-7h3l3-3-3-3h-3z"/>
              </Svg>
              <Text style={styles.cardHeaderTitle}>Blood Inventory</Text>
            </View>

            <View style={styles.invRow}>
              {/* Stats columns */}
              <View style={styles.invStatsBlock}>
                <View style={styles.invStat}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
                    <Path d="M12 2L8 9H5l-3 3 3 3h3l4 7 4-7h3l3-3-3-3h-3z"/>
                  </Svg>
                  <Text style={styles.invStatNum}>{hospital.bloodTypesCount}</Text>
                  <Text style={styles.invStatLabel}>Blood Types{'\n'}Available</Text>
                </View>
                <View style={styles.invStatDivider} />
                <View style={styles.invStat}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
                    <Path d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01"/>
                  </Svg>
                  <Text style={styles.invStatNum}>{hospital.totalUnits}</Text>
                  <Text style={styles.invStatLabel}>Total Units{'\n'}Available</Text>
                </View>
              </View>

              {/* View Inventory button */}
              <TouchableOpacity
                style={styles.viewInvBtn}
                onPress={() =>
                  navigation.navigate('Tabs', {
                    screen: 'Inventory',
                    params: { hospitalId: hospital.id, hospitalName: hospital.name },
                  })
                }
                activeOpacity={0.82}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <Path d="M12 2L8 9H5l-3 3 3 3h3l4 7 4-7h3l3-3-3-3h-3z"/>
                </Svg>
                <Text style={styles.viewInvText}>View{'\n'}Inventory</Text>
                <View style={styles.viewInvChevron}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="9 18 15 12 9 6"/>
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Actions Section ── */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.actionsSection}>
            <View style={styles.cardHeader}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </Svg>
              <Text style={styles.cardHeaderTitle}>Actions</Text>
            </View>

            <View style={styles.actionsRow}>
              {/* View Blood Inventory */}
              <TouchableOpacity
                style={styles.actionBtnRed}
                onPress={() =>
                  navigation.navigate('Tabs', {
                    screen: 'Inventory',
                    params: { hospitalId: hospital.id, hospitalName: hospital.name },
                  })
                }
                activeOpacity={0.82}
              >
                <View style={styles.actionIconCircle}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 2L8 9H5l-3 3 3 3h3l4 7 4-7h3l3-3-3-3h-3z"/>
                  </Svg>
                </View>
                <Text style={styles.actionBtnTitle}>View Blood{'\n'}Inventory</Text>
                <Text style={styles.actionBtnSub}>Check available{'\n'}blood stock</Text>
                <View style={styles.actionChevronWhite}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="9 18 15 12 9 6"/>
                  </Svg>
                </View>
              </TouchableOpacity>

              {/* Call Hospital */}
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={callHospital}
                activeOpacity={0.82}
              >
                <View style={styles.actionIconCirclePink}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </Svg>
                </View>
                <Text style={styles.actionBtnTitleDark}>Call Hospital</Text>
                <Text style={styles.actionBtnSubDark}>Call the hospital{'\n'}directly</Text>
                <View style={styles.actionChevronRed}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="9 18 15 12 9 6"/>
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topBarBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center' },
  topBarLogo: { width: 30, height: 30 },
  topBarBrand: {},
  brandVita: { fontSize: 15, fontWeight: '800', color: '#1A2341' },
  brandFlux: { fontSize: 15, fontWeight: '800', color: '#E53935' },
  topBarSub: { fontSize: 10, color: '#9CA3AF' },

  // ── Banner Card ──
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerImage: {
    height: 200,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  bannerImagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5',
  },
  placeholderIcon: { width: 64, height: 64, opacity: 0.35 },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  bannerIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bannerTextBlock: { flex: 1 },
  bannerName: { fontSize: 16, fontWeight: '800', color: '#1A2341', marginBottom: 3 },
  bannerLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bannerLocation: { fontSize: 12, color: '#9CA3AF', flex: 1 },
  stockBadge: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', flexShrink: 0,
  },
  stockBadgeAvailable: { backgroundColor: '#F0FDF4' },
  stockBadgeUnavailable: { backgroundColor: '#FEF2F2' },
  stockDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  stockBadgeText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // ── Info Card ──
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, paddingBottom: 12,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#1A2341' },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  infoRowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoRowContent: { flex: 1 },
  infoRowLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRowValue: { fontSize: 14, fontWeight: '600', color: '#1A2341' },
  callCircleBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
  },
  open24Badge: {
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  open24Text: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  hoursText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // ── Inventory Card ──
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  invRow: {
    flexDirection: 'row',
    padding: 14,
    paddingTop: 4,
    gap: 12,
  },
  invStatsBlock: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  invStat: { flex: 1, alignItems: 'center' },
  invStatNum: { fontSize: 22, fontWeight: '800', color: '#1A2341' },
  invStatLabel: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  invStatDivider: { width: 1, backgroundColor: '#FECDD3' },
  viewInvBtn: {
    width: 90, borderRadius: 12,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
    padding: 10, gap: 4,
  },
  viewInvText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  viewInvChevron: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },

  // ── Actions ──
  actionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 12,
  },
  actionBtnRed: {
    flex: 1, borderRadius: 14,
    backgroundColor: '#E53935',
    padding: 14, gap: 6,
  },
  actionBtnOutline: {
    flex: 1, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E53935',
    backgroundColor: '#FFFFFF',
    padding: 14, gap: 6,
  },
  actionIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  actionIconCirclePink: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  actionBtnTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  actionBtnTitleDark: { fontSize: 13, fontWeight: '800', color: '#1A2341' },
  actionBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  actionBtnSubDark: { fontSize: 11, color: '#6B7280' },
  actionChevronWhite: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  actionChevronRed: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
});
