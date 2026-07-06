import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, spacing, typography } from '../theme';

const EyeIcon = ({ color = colors.textSecondary }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
  </Svg>
);

const EyeOffIcon = ({ color = colors.textSecondary }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Path d="M1 1l22 22" />
  </Svg>
);

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export default function AppInput({
  label,
  error,
  containerStyle,
  rightIcon,
  leftIcon,
  isPassword = false,
  ...rest
}: AppInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        <TextInput
          {...rest}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : null,
            isPassword || rightIcon ? { paddingRight: 44 } : null,
          ]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.6}
          >
            {showPassword ? (
              <EyeOffIcon color={focused ? colors.primary : colors.textSecondary} />
            ) : (
              <EyeIcon color={focused ? colors.primary : colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.cardElevated,
  },
  inputError: { borderColor: colors.unavailable },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.text,
    height: '100%',
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: {
    position: 'absolute',
    right: spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.unavailable,
    marginTop: spacing.xs,
  },
});
