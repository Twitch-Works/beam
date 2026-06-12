import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'

interface ProfileStatsProps {
  sessions: number
  activities: number
  children: number
}

export function ProfileStats({ sessions, activities, children }: ProfileStatsProps) {
  const stats = [
    { label: 'Sessions',   value: String(sessions) },
    { label: 'Activities', value: String(activities) },
    { label: 'Children',   value: String(children) },
  ]
  return (
    <View style={styles.statsRow}>
      {stats.map((stat, i) => (
        <View key={stat.label} style={[styles.statBox, i < 2 && styles.statBoxBorder]}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    ...shadows.card,
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statBoxBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statValue: { fontSize: fontSize.h2, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.primary },
  statLabel: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-Regular', marginTop: 2 },
})
