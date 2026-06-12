import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type Size = 'md' | 'sm'

interface ButtonProps {
  label?: string
  onPress: () => void
  variant?: Variant
  icon?: string
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  size?: Size
  haptic?: 'light' | 'medium' | 'none'
  style?: ViewStyle
}

export const Button = React.memo(function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  fullWidth,
  size = 'md',
  haptic,
  style,
}: ButtonProps) {
  const defaultHaptic = variant === 'primary' || variant === 'danger' ? 'medium' : 'light'
  const hapticStyle = haptic ?? defaultHaptic

  const handlePress = React.useCallback(async () => {
    if (hapticStyle === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else if (hapticStyle === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onPress()
  }, [onPress, hapticStyle])

  const isFullWidth = fullWidth ?? (variant !== 'icon')
  const height = size === 'sm' ? 36 : (variant === 'icon' ? 36 : 48)
  const iconSize = size === 'sm' ? 18 : 20

  const containerStyle = [
    styles.base,
    variantStyles[variant],
    { height },
    isFullWidth && styles.fullWidth,
    variant === 'icon' && { width: height, borderRadius: height / 2 },
    (disabled || loading) && styles.disabled,
    style,
  ]

  const textStyle = [
    styles.label,
    size === 'sm' && styles.labelSm,
    variantTextStyles[variant],
  ]

  const iconColor = variant === 'primary' || variant === 'danger' || variant === 'icon'
    ? colors.white
    : colors.primary

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={iconSize} color={iconColor} />}
          {label && variant !== 'icon' && <Text style={textStyle}>{label}</Text>}
        </>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.button,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
  labelSm: {
    fontSize: fontSize.body,
  },
})

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  danger: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    backgroundColor: colors.primary,
  },
})

const variantTextStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.primary },
  ghost: { color: colors.primary },
  danger: { color: colors.white },
  icon: { color: colors.white },
})
