import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onClear,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);
  const { theme } = useTheme();

  const handleFocus = () => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: 250 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: 250 });
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.searchBorder, 'rgba(229,57,53,0.45)']
    );

    return {
      borderColor,
      backgroundColor: theme.searchBg,
      shadowOpacity: 0,
      shadowRadius: 0,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: theme.searchText }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.searchPlaceholder}
        selectionColor={theme.primary}
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <View style={[styles.clearIconWrap, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Text style={[styles.clearIcon, { color: theme.textSecondary }]}>✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderWidth: 1.5,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    height: '100%',
    paddingVertical: 0,
  },
  clearIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  clearIcon: {
    fontSize: 10,
    fontWeight: '700',
  },
});
