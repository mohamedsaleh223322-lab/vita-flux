import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useInventorySocket } from '../../hooks/useInventorySocket';
import { useInventoryStore } from '../../store/inventoryStore';
import { inventoryApi } from '../../api/inventory';
import BloodInventoryCard from '../../components/BloodInventoryCard';
import { InventoryCardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../theme';
import { BloodInventoryItem, MainStackParamList } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { BLOOD_TYPE_ORDER } from '../../utils/bloodStatus';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Inventory'>;
type Route = RouteProp<MainStackParamList, 'Inventory'>;

// ECG / pulse line SVG illustration
function EcgLine() {
  return (
    <Svg width={80} height={36} viewBox="0 0 80 36" fill="none">
      <Polyline
        points="0,18 14,18 18,6 22,30 28,10 34,26 40,18 80,18"
        stroke="#E53935"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function InventoryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Safe extraction of params (handles bottom tab launch safely)
  const { hospitalId, hospitalName } = route.params || {};

  const { inventory, lastUpdated, isLive, isLoading, setInventory, setIsLoading } =
    useInventoryStore();

  // Connect socket + initial load (if hospital is selected)
  useInventorySocket(hospitalId || '');

  const handleRefresh = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      const res = await inventoryApi.getByHospital(hospitalId);
      setInventory(res.inventory, res.last_updated);
    } catch {
      setIsLoading(false);
    }
  }, [hospitalId]);

  // Sort inventory to match standard blood type order
  const sortedInventory = BLOOD_TYPE_ORDER.map(
    (bt) => inventory.find((i) => i.blood_type === bt) ?? { blood_type: bt, available_units: 0 }
  ) as BloodInventoryItem[];

  // Two-column grid via FlatList numColumns
  const renderItem = ({ item, index }: { item: BloodInventoryItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={styles.cardWrap}
    >
      <BloodInventoryCard item={item} />
    </Animated.View>
  );

  const renderSkeletons = () => (
    <View style={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.cardWrap}>
          <InventoryCardSkeleton />
        </View>
      ))}
    </View>
  );

  const totalAvailable = inventory.reduce((sum, i) => sum + i.available_units, 0);
  const typesAvailable = inventory.filter((i) => i.available_units > 0).length;

  // Render empty state if no hospital is selected
  if (!hospitalId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Centered header: blood drop + title */}
          <View style={[styles.centeredHeader, { borderBottomColor: theme.border }]}>
            <Text style={styles.centeredHeaderIcon}>🩸</Text>
            <Text style={[styles.centeredHeaderTitle, { color: theme.text }]}>Blood Inventory</Text>
          </View>
          <View style={styles.center}>
            <EmptyState
              title="No Hospital Selected"
              subtitle="Select a hospital from the Hospital tab to view its live blood inventory."
              icon="🩸"
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Centered header: blood drop + title ── */}
        <View style={[styles.centeredHeader, { borderBottomColor: theme.border }]}>
          <Text style={styles.centeredHeaderIcon}>🩸</Text>
          <Text style={[styles.centeredHeaderTitle, { color: theme.text }]}>Blood Inventory</Text>
        </View>

        {/* ── Live status card ── */}
        <Animated.View entering={FadeIn.duration(400)} style={[styles.statusCard, { backgroundColor: theme.statusCardBg }]}>
          <View style={styles.statusLeft}>
            <View style={styles.statusTopRow}>
              <View style={[styles.liveDot, { backgroundColor: isLive ? '#10B981' : theme.textMuted }]} />
              <Text style={[styles.liveLabel, { color: isLive ? '#10B981' : theme.textMuted }]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
              {lastUpdated && (
                <Text style={[styles.updatedText, { color: theme.textMuted }]}>· Updated {formatTimeAgo(lastUpdated)}</Text>
              )}
            </View>
            <View style={styles.statusBottomRow}>
              <Text style={[styles.statNumber, { color: theme.statNumberColor }]}>{totalAvailable}</Text>
              <Text style={[styles.statSep, { color: theme.textMuted }]}> units  |  </Text>
              <Text style={[styles.statTypes, { color: theme.textMuted }]}>{typesAvailable}/8 types</Text>
            </View>
          </View>
          <View style={styles.statusRight}>
            <EcgLine />
          </View>
        </Animated.View>

        {/* ── Legend ── */}
        <View style={styles.legend}>
          <View style={[styles.legendPill, { backgroundColor: theme.legendPillBg }]}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Available</Text>
          </View>
          <View style={[styles.legendPill, { backgroundColor: theme.legendPillBg }]}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Low</Text>
          </View>
          <View style={[styles.legendPill, { backgroundColor: theme.legendPillBg }]}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>None</Text>
          </View>
        </View>

        {/* ── Grid Content ── */}
        {isLoading && inventory.length === 0 ? (
          renderSkeletons()
        ) : inventory.length === 0 ? (
          <EmptyState
            title="No inventory data"
            subtitle="This hospital hasn't registered any blood inventory data yet."
            icon="🩸"
          />
        ) : (
          <FlatList
            data={sortedInventory}
            keyExtractor={(item) => item.blood_type}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
              />
            }
            columnWrapperStyle={styles.row}
          />
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },

  // Centered header
  centeredHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  centeredHeaderIcon: {
    fontSize: 26,
  },
  centeredHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Live status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  statusLeft: {
    flex: 1,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  updatedText: {
    ...typography.caption,
    fontWeight: '500',
  },
  statusBottomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statSep: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
  statTypes: {
    ...typography.bodyMd,
    fontWeight: '600',
  },
  statusRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // Grid
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  row: { justifyContent: 'space-between' },
  cardWrap: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
});
