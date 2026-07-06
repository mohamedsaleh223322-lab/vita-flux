import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

const TabButton = ({
  icon,
  label,
  isActive,
  onPress,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={[styles.tabText, { color: isActive ? '#E53935' : theme.textMuted }, isActive && styles.tabTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.navBg,
        borderTopColor: theme.navBorder,
        paddingBottom: insets.bottom,
      },
    ]}>
      <View style={[styles.bar, { backgroundColor: theme.navBg }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Assign SVG icon based on route name
          let icon = null;
          const strokeColor = isFocused ? '#E53935' : theme.textMuted;

          if (route.name === 'Inventory') {
            icon = (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z" />
              </Svg>
            );
          } else if (route.name === 'Hospital') {
            icon = (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 21h18" />
                <Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                <Path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
                <Path d="M10 10h4" />
                <Path d="M12 8v4" />
              </Svg>
            );
          } else if (route.name === 'Profile') {
            icon = (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx={12} cy={7} r={4} />
              </Svg>
            );
          }

          return (
            <TabButton
              key={route.key}
              label={label}
              isActive={isFocused}
              onPress={onPress}
              icon={icon}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#E53935',
    fontWeight: '700',
  },
});
