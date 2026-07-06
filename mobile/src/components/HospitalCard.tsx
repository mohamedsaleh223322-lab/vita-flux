import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { Hospital } from '../types';
import { colors, spacing, radius, typography, shadows } from '../theme';
import StatusBadge from './StatusBadge';
import FavoriteButton from './FavoriteButton';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface HospitalCardProps {
  hospital: Hospital;
  onPress: () => void;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
}

// Deterministic hashing for UUID/strings
function getSeed(str: string): number {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Icon variation configurations
const ICON_VARIANTS = [
  {
    name: 'hospital',
    colors: ['#00F2FE', '#4FACFE'] as const, // Teal to Blue
    glow: 'rgba(0, 242, 254, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 21h18" />
        <Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        <Path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
        <Path d="M10 10h4" />
        <Path d="M12 8v4" />
      </Svg>
    ),
  },
  {
    name: 'medical-shield',
    colors: ['#7F00FF', '#E100FF'] as const, // Purple to Pink
    glow: 'rgba(127, 0, 255, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <Path d="M10 12h4" />
        <Path d="M12 10v4" />
      </Svg>
    ),
  },
  {
    name: 'heartbeat',
    colors: ['#FF3B30', '#FF2D55'] as const, // Red to Rose Pink
    glow: 'rgba(255, 59, 48, 0.25)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <Path d="M8 12h2.5l1.5-3 2 6 1.5-3H18" />
      </Svg>
    ),
  },
  {
    name: 'emergency',
    colors: ['#F5576C', '#F093FB'] as const, // Hot Pink to Light Purple
    glow: 'rgba(245, 87, 108, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={12} r={10} />
        <Path d="M12 8v8" />
        <Path d="M8 12h8" />
      </Svg>
    ),
  },
  {
    name: 'clinic',
    colors: ['#10B981', '#059669'] as const, // Emerald to Dark Green
    glow: 'rgba(16, 185, 129, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x={2} y={6} width={20} height={14} rx={2} />
        <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <Path d="M12 10v6" />
        <Path d="M9 13h6" />
      </Svg>
    ),
  },
  {
    name: 'pulse',
    colors: ['#00C6FF', '#0072FF'] as const, // Cyan to Deep Blue
    glow: 'rgba(0, 198, 255, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x={3} y={3} width={18} height={18} rx={2} />
        <Path d="M7 12h3l2-5 2 10 2-5h3" />
      </Svg>
    ),
  },
  {
    name: 'medical-plus',
    colors: ['#FAD961', '#F76B1C'] as const, // Gold to Orange
    glow: 'rgba(247, 107, 28, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2v22" />
        <Path d="M2 12h22" />
      </Svg>
    ),
  },
  {
    name: 'healthcare-building',
    colors: ['#4A90E2', '#34C759'] as const, // Sky Blue to Lime Green
    glow: 'rgba(74, 144, 226, 0.22)',
    render: (color: string) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 21h18" />
        <Path d="M5 21V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v12" />
        <Path d="M12 21V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v16" />
        <Path d="M7 11h2" />
        <Path d="M14 7h2" />
        <Path d="M14 11h2" />
      </Svg>
    ),
  },
];

export default function HospitalCard({
  hospital,
  onPress,
  onFavoriteToggle,
  isFavorite = false,
}: HospitalCardProps) {
  const scale = useSharedValue(1);

  // Get dynamic icon variant based on hospital ID hash
  const seed = getSeed(hospital.id);
  const variantIndex = seed % ICON_VARIANTS.length;
  const variant = ICON_VARIANTS[variantIndex];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const status = hospital.total_units === 0
    ? 'NOT_AVAILABLE'
    : hospital.available_types <= 2
    ? 'LOW'
    : 'AVAILABLE';

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      activeOpacity={0.9}
      style={[styles.card, shadows.card, animStyle]}
    >
      <View style={styles.cardRow}>
        {/* Glowing Dynamic Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconGlow, { backgroundColor: variant.glow }]} />
          <LinearGradient
            colors={variant.colors}
            style={styles.iconBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {variant.render(colors.white)}
          </LinearGradient>
        </View>

        {/* Card Main Info */}
        <View style={styles.infoContent}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {hospital.name}
            </Text>
          </View>
          
          <Text style={styles.address} numberOfLines={1}>
            📍 {hospital.address}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.inventoryBadge}>
              <Text style={styles.inventoryText}>
                🩸 {hospital.total_units} units · {hospital.available_types} types
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>
        </View>

        {/* Right Side Actions and Chevron */}
        <View style={styles.rightColumn}>
          {onFavoriteToggle ? (
            <View style={styles.favBtnWrap}>
              <FavoriteButton isFavorite={isFavorite} onToggle={onFavoriteToggle} />
            </View>
          ) : null}
          
          {/* chevron arrow indicator */}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={styles.chevron}>
            <Polyline points="9 18 15 12 9 6" />
          </Svg>
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconBackground: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    zIndex: 1,
    opacity: 0.85,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...typography.headingSm,
    color: colors.text,
    fontWeight: '800',
  },
  address: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inventoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: spacing.sm,
  },
  inventoryText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingLeft: spacing.sm,
  },
  favBtnWrap: {
    marginBottom: spacing.xs,
  },
  chevron: {
    opacity: 0.6,
  },
});
