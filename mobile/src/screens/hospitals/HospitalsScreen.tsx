import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { hospitalsApi } from '../../api/hospitals';
import { favoritesApi } from '../../api/favorites';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useAuthStore } from '../../store/authStore';
import EmptyState from '../../components/EmptyState';
import { HospitalCardSkeleton } from '../../components/LoadingSkeleton';
import { spacing } from '../../theme';
import { Hospital, MainStackParamList } from '../../types';

// @ts-ignore
const logoIcon = require('../../../assets/icon 4.png');

type Nav = NativeStackNavigationProp<MainStackParamList, 'Hospitals'>;
type Route = RouteProp<MainStackParamList, 'Hospitals'>;

// ── Hospital Card ──────────────────────────────────────────────────────────

function HospitalCard({
  item,
  onPress,
}: {
  item: Hospital;
  onPress: () => void;
}) {
  const hasImage = !!item.imageUrl;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Hospital image */}
      <View style={styles.cardImage}>
        {hasImage ? (
          <Image
            source={{ uri: item.imageUrl! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Image source={logoIcon} style={styles.placeholderIcon} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Right content */}
      <View style={styles.cardContent}>
        {/* Row 1: name + stock badge */}
        <View style={styles.cardRow1}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={[
            styles.stockBadge,
            item.stockStatus === 'available' ? styles.stockBadgeAvailable : styles.stockBadgeUnavailable,
          ]}>
            <View style={[
              styles.stockDot,
              { backgroundColor: item.stockStatus === 'available' ? '#16A34A' : '#EF4444' },
            ]} />
            <Text style={[
              styles.stockBadgeText,
              { color: item.stockStatus === 'available' ? '#16A34A' : '#EF4444' },
            ]}>
              {item.stockStatus === 'available' ? 'Stock Available' : 'No Stock'}
            </Text>
          </View>
        </View>

        {/* Row 2: location */}
        <View style={styles.cardRow}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <Circle cx={12} cy={10} r={3}/>
          </Svg>
          <Text style={styles.cardMeta}>{item.address || 'Egypt'}</Text>
        </View>

        {/* Row 3: blood bank + hours */}
        <View style={styles.cardRow}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2L8 9H5l-3 3 3 3h3l4 7 4-7h3l3-3-3-3h-3z"/>
          </Svg>
          <Text style={styles.cardMeta}>Blood Bank</Text>
          <View style={styles.metaSep} />
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={12} cy={12} r={10}/>
            <Path d="M12 6v6l4 2"/>
          </Svg>
          <Text style={styles.cardMeta}>
            {item.open24Hours ? 'Open 24 Hours' : `${item.openingTime} - ${item.closingTime}`}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronWrap}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="9 18 15 12 9 6"/>
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function HospitalsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { governorateId, governorateName } = route.params;
  const { isLoggedIn } = useAuthStore();
  const { isFavorite, setFavorites, addLocal, removeLocal } = useFavoritesStore();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filtered, setFiltered] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadHospitals = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const [data, favs] = await Promise.all([
        hospitalsApi.getByGovernorate(governorateId),
        isLoggedIn ? favoritesApi.getAll() : Promise.resolve([]),
      ]);
      setHospitals(data);
      setFiltered(data);
      if (isLoggedIn) setFavorites(favs);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [governorateId, isLoggedIn]);

  useEffect(() => { loadHospitals(); }, []);

  // Debounced local search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (!search.trim()) {
        setFiltered(hospitals);
      } else {
        const q = search.toLowerCase();
        setFiltered(
          hospitals.filter(
            (h) =>
              h.name.toLowerCase().includes(q) ||
              (h.address || '').toLowerCase().includes(q)
          )
        );
      }
    }, 300);
  }, [search, hospitals]);

  const renderItem = ({ item, index }: { item: Hospital; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(400)}>
      <HospitalCard
        item={item}
        onPress={() =>
          navigation.navigate('HospitalDetail', {
            hospitalId: item.id,
            hospitalName: item.name,
          })
        }
      />
    </Animated.View>
  );

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, i) => <HospitalCardSkeleton key={i} />);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Top Header ── */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <Image source={logoIcon} style={styles.headerLogo} resizeMode="contain" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.brandRow}>
                <Text style={styles.brandVita}>VITA </Text>
                <Text style={styles.brandFlux}>FLUX</Text>
              </Text>
              <Text style={styles.brandTagline}>Smart Stock. Better Care.</Text>
            </View>
          </View>
          {/* Filter button */}
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.75}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Page Title ── */}
        <View style={styles.pageTitleBlock}>
          <Text style={styles.pageTitleLine}>
            <Text style={styles.pageTitleDark}>Private Hospitals in </Text>
            <Text style={styles.pageTitleRed}>{governorateName}</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Find and connect with private hospitals near you.
          </Text>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
            <Circle cx={11} cy={11} r={8}/>
            <Path d="M21 21l-4.35-4.35"/>
          </Svg>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search hospital name"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={10}/>
                <Path d="M15 9l-6 6M9 9l6 6"/>
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* ── List ── */}
        {loading ? (
          <View style={styles.skeletonWrap}>{renderSkeletons()}</View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadHospitals(true)}
                tintColor="#E53935"
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No hospitals found"
                subtitle={
                  search
                    ? `No results for "${search}"`
                    : 'No hospitals registered for this governorate yet.'
                }
                icon="🏥"
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },

  // ── Header ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  topHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 40, height: 40 },
  brandRow: {},
  brandVita: { fontSize: 18, fontWeight: '800', color: '#1A2341' },
  brandFlux: { fontSize: 18, fontWeight: '800', color: '#E53935' },
  brandTagline: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  filterBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Page Title ──
  pageTitleBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  pageTitleLine: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  pageTitleDark: { color: '#1A2341', fontSize: 22, fontWeight: '700' },
  pageTitleRed: { color: '#E53935', fontSize: 22, fontWeight: '700' },
  pageSubtitle: { color: '#6B7280', fontSize: 13, marginTop: 4 },

  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A2341',
    padding: 0,
  },

  // ── List ──
  list: { paddingHorizontal: 16, paddingBottom: spacing.xxl },
  skeletonWrap: { paddingHorizontal: 16, paddingTop: 8 },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: 110,
    height: 90,
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    flexShrink: 0,
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderIcon: { width: 44, height: 44, opacity: 0.4 },

  cardContent: {
    flex: 1,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 10,
    gap: 4,
  },
  cardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2341',
    flex: 1,
    marginRight: 6,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockBadgeAvailable: { backgroundColor: '#F0FDF4' },
  stockBadgeUnavailable: { backgroundColor: '#FEF2F2' },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMeta: { fontSize: 12, color: '#6B7280' },
  metaSep: { width: 1, height: 10, backgroundColor: '#E5E7EB', marginHorizontal: 4 },

  chevronWrap: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
});
