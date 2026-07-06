import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BloodStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../utils/bloodStatus';
import { radius, typography } from '../theme';

interface StatusBadgeProps {
  status: BloodStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}20`, borderColor: `${color}40` },
        size === 'md' && styles.badgeMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          { color },
          size === 'md' && styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: 13,
  },
});
