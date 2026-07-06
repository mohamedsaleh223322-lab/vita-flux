import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../theme';

function SkeletonBlock({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border },
        animStyle,
        style,
      ]}
    />
  );
}

export function HospitalCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <SkeletonBlock width={180} height={18} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={100} height={12} />
        </View>
        <SkeletonBlock width={32} height={32} borderRadius={16} />
      </View>
      <SkeletonBlock width="100%" height={14} style={{ marginVertical: spacing.md }} />
      <SkeletonBlock width={140} height={14} />
    </View>
  );
}

export function InventoryCardSkeleton() {
  return (
    <View style={styles.invCard}>
      <SkeletonBlock width={48} height={36} style={{ marginBottom: spacing.sm }} />
      <SkeletonBlock width={60} height={14} style={{ marginBottom: spacing.sm }} />
      <SkeletonBlock width={80} height={22} borderRadius={radius.full} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  invCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.xs,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
