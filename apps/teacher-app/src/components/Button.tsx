import * as Haptics from 'expo-haptics'
import React from 'react'
import { Animated, Pressable, StyleSheet, Text, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../constants/theme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = {
  label: string
  onPress?: (event: GestureResponderEvent) => void
  variant?: ButtonVariant
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  testID?: string
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(function Button(
  { disabled = false, label, onPress, style, testID, variant = 'primary' },
  ref,
) {
  const scale = React.useRef(new Animated.Value(1)).current

  const animateTo = React.useCallback((value: number) => {
    Animated.spring(scale, {
      toValue: value,
      damping: 14,
      stiffness: 220,
      useNativeDriver: true,
    }).start()
  }, [scale])

  const handlePress = React.useCallback((event: GestureResponderEvent) => {
    if (!disabled && variant === 'primary') {
      Haptics.selectionAsync().catch(() => undefined)
    }
    onPress?.(event)
  }, [disabled, onPress, variant])

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={handlePress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        ref={ref}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
        testID={testID}
      >
        <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel, disabled && styles.disabledLabel]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  disabled: {
    borderColor: colors.border,
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  disabledLabel: {
    color: colors.gray,
  },
})
