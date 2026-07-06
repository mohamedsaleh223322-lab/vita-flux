import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../store/authStore';

// @ts-ignore
const logoIcon = require('../../assets/icon 4.png');

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SplashScreen() {
  const { bootstrap } = useAuthStore();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
    translateY.value = withSpring(0, { damping: 14 });

    // Progress bar fill over ~1.8s
    progressWidth.value = withTiming(100, { duration: 1800, easing: Easing.inOut(Easing.ease) });

    // Bootstrap auth (load token from SecureStore)
    const timer = setTimeout(() => bootstrap(), 800);
    return () => clearTimeout(timer);
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Center content */}
      <Animated.View style={[styles.centerContent, contentStyle]}>
        {/* Logo image */}
        <Image source={logoIcon} style={styles.logo} resizeMode="contain" />

        {/* Brand name */}
        <Text style={styles.brandRow}>
          <Text style={styles.brandVita}>VITA </Text>
          <Text style={styles.brandFlux}>FLUX</Text>
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Smart Stock. Better Care.</Text>
      </Animated.View>

      {/* Progress bar — absolute bottom */}
      <Animated.View style={[styles.progressSection, contentStyle]}>
        {/* Track */}
        <View style={styles.progressTrack}>
          {/* Fill */}
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <Text style={styles.loadingText}>Loading Better Care...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Center content
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  brandRow: {
    lineHeight: 42,
  },
  brandVita: {
    color: '#1A2341',
    fontWeight: '800',
    fontSize: 36,
    letterSpacing: 1,
  },
  brandFlux: {
    color: '#E53935',
    fontWeight: '800',
    fontSize: 36,
    letterSpacing: 1,
  },
  tagline: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '400',
    marginTop: 6,
  },

  // Progress bar
  progressSection: {
    position: 'absolute',
    bottom: 120,
    width: SCREEN_WIDTH * 0.6,
    alignSelf: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#E53935',
    borderRadius: 3,
  },
  loadingText: {
    color: '#1A2341',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
});
