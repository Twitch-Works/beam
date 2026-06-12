import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

interface UpcomingSession {
  id: string
  scheduledAt?: string | null
  activityTitle?: string | null
}

interface UpcomingSessionCardProps {
  session: UpcomingSession
}

export const UpcomingSessionCard = React.memo(function UpcomingSessionCard({
  session,
}: UpcomingSessionCardProps) {
  const d = session.scheduledAt ? new Date(session.scheduledAt) : null
  const dateStr = d
    ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '—'
  const timeStr = d
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : ''

  return (
    <TouchableOpacity
      style={styles.upcomingCard}
      onPress={() => router.push(`/(root)/booking/${session.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.upcomingIcon}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.upcomingLabel}>Next Session</Text>
        <Text style={styles.upcomingTitle} numberOfLines={1}>
          {session.activityTitle ?? '—'}
        </Text>
        <Text style={styles.upcomingMeta}>
          {dateStr}
          {timeStr ? ` · ${timeStr}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  upcomingTitle: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  upcomingMeta: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    marginTop: 1,
  },
})
