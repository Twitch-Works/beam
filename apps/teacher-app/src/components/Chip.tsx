import React from 'react'
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fontSize, fontWeight, spacing } from '../constants/theme'

type ChipTone = 'teal' | 'mint' | 'amber' | 'gray'

type ChipProps = {
  label: string
  tone?: ChipTone
  style?: StyleProp<ViewStyle>
}

const tones: Record<ChipTone, { backgroundColor: string; color: string }> = {
  teal: { backgroundColor: colors.primary, color: colors.white },
  mint: { backgroundColor: colors.mint, color: colors.primary },
  amber: { backgroundColor: colors.statusUpcomingBg, color: colors.statusUpcomingText },
  gray: { backgroundColor: '#EEF3F7', color: colors.gray },
}

export const Chip = React.memo(function Chip({ label, style, tone = 'mint' }: ChipProps) {
  const config = tones[tone]

  return (
    <Text style={[styles.chip, config, style]}>
      {label}
    </Text>
  )
})

const styles = StyleSheet.create({
  chip: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
})
