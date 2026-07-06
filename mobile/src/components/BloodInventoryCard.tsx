import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BloodInventoryItem } from '../types';
import { getBloodStatus, getStatusColor, getStatusLabel } from '../utils/bloodStatus';
import { colors, spacing, radius, typography } from '../theme';

interface BloodInventoryCardProps {
  item: BloodInventoryItem;
}

// Tinted background colors per status
const STATUS_BG: Record<string, string> = {
  AVAILABLE:     'rgba(16, 185, 129, 0.10)',  // dark green tint
  LOW:           'rgba(245, 158, 11, 0.10)',   // dark yellow/olive tint
  NOT_AVAILABLE: 'rgba(239, 68, 68, 0.10)',    // dark red tint
};

// Outline blood-drop icon
function BloodDropIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2C6.48 2 2 8 2 13a10 10 0 0 0 20 0C22 8 17.52 2 12 2z" />
    </Svg>
  );
}

export default function BloodInventoryCard({ item }: BloodInventoryCardProps) {
  const status = getBloodStatus(item.available_units);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const cardBg = STATUS_BG[status] ?? STATUS_BG.NOT_AVAILABLE;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {/* Top-right: outline blood drop icon */}
      <View style={styles.dropIcon}>
        <BloodDropIcon color={statusColor} />
      </View>

      {/* Blood type: large bold top-left, colored by status */}
      <Text style={[styles.bloodType, { color: statusColor }]}>
        {item.blood_type}
      </Text>

      {/* Units: bold white number + small gray "units" */}
      <Text style={styles.units}>
        {item.available_units}
        <Text style={styles.unitsLabel}> units</Text>
      </Text>

      {/* Status badge: small rounded pill bottom-left */}
      <View style={[styles.pill, { backgroundColor: `${statusColor}20` }]}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={[styles.pillText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.xs,
    minHeight: 140,
    position: 'relative',
  },
  dropIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  bloodType: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    marginTop: 4,
  },
  units: {
    ...typography.headingLg,
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  unitsLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
