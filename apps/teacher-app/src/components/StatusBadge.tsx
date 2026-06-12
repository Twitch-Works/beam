import React from 'react'
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fontSize, fontWeight, radius, spacing } from '../constants/theme'

export type DisplayStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

type StatusBadgeProps = {
  status: DisplayStatus
  style?: StyleProp<ViewStyle>
  testID?: string
}

const statusStyles: Record<DisplayStatus, { backgroundColor: string; color: string; label: string }> = {
  pending: {
    backgroundColor: colors.statusPendingBg,
    color: colors.statusPendingText,
    label: 'Pending',
  },
  confirmed: {
    backgroundColor: colors.statusConfirmedBg,
    color: colors.statusConfirmedText,
    label: 'Confirmed',
  },
  completed: {
    backgroundColor: colors.statusCompletedBg,
    color: colors.statusCompletedText,
    label: 'Completed',
  },
  cancelled: {
    backgroundColor: colors.statusCancelledBg,
    color: colors.statusCancelledText,
    label: 'Cancelled',
  },
  rescheduled: {
    backgroundColor: '#EDE9FE',
    color: '#5B21B6',
    label: 'Rescheduled',
  },
}

export const StatusBadge = React.memo(function StatusBadge({ status, style, testID }: StatusBadgeProps) {
  const config = statusStyles[status] ?? statusStyles.pending

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor, color: config.color },
        style,
      ]}
      testID={testID}
    >
      {config.label}
    </Text>
  )
})

const styles = StyleSheet.create({
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
})
