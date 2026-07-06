import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../theme';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function HospitalTabScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();

  const handleStartBrowsing = () => {
    navigation.navigate('Governorate');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>

          {/* Icon */}
          <Animated.View
            style={[styles.iconWrap, { backgroundColor: theme.surface }]}
            entering={FadeInUp.duration(500)}
          >
            <Svg
              width={40}
              height={40}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.mode === 'dark' ? '#FFFFFF' : theme.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M3 21h18" />
              <Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              <Path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
              <Path d="M10 10h4" />
              <Path d="M12 8v4" />
            </Svg>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[styles.title, { color: theme.text }]}
            entering={FadeInDown.delay(100).duration(450)}
          >
            Find Nearby Hospitals
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text
            style={[styles.subtitle, { color: theme.textMuted }]}
            entering={FadeInDown.delay(180).duration(450)}
          >
            Search healthcare centers and view their real-time blood inventory status.
          </Animated.Text>

          {/* CTA Button */}
          <Animated.View style={styles.ctaWrap} entering={FadeInDown.delay(280).duration(450)}>
            <TouchableOpacity
              onPress={handleStartBrowsing}
              style={styles.btn}
              activeOpacity={0.82}
            >
              <Text style={styles.btnText}>Select Governorate  →</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxl,
  },
  ctaWrap: {
    width: '100%',
  },
  btn: {
    height: 54,
    borderRadius: radius.full,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
