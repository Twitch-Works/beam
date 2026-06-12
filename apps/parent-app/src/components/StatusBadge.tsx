import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: colors.statusUpcomingBg,     text: colors.statusUpcomingText },
  upcoming:    { label: 'Upcoming',    bg: colors.statusUpcomingBg,     text: colors.statusUpcomingText },
  confirmed:   { label: 'Confirmed',   bg: colors.statusConfirmedBg,   text: colors.statusConfirmedText },
  completed:   { label: 'Completed',   bg: colors.statusCompletedBg,   text: colors.statusCompletedText },
  cancelled:   { label: 'Cancelled',   bg: colors.statusCancelledBg,   text: colors.statusCancelledText },
  rescheduled: { label: 'Rescheduled', bg: colors.statusRescheduledBg, text: colors.statusRescheduledText },
}

interface StatusBadgeProps {
  status: string
}

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.badge,
  },
  text: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
  },
})
