import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
}

export default function FavoriteButton({
  isFavorite,
  onToggle,
  size = 36,
}: FavoriteButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.4, { damping: 6 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onToggle();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        isFavorite && styles.active,
        animStyle,
      ]}
    >
      <Animated.Text style={{ fontSize: size * 0.5 }}>
        {isFavorite ? '❤️' : '🤍'}
      </Animated.Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: 'rgba(211,47,47,0.15)',
    borderColor: colors.primary,
  },
});
