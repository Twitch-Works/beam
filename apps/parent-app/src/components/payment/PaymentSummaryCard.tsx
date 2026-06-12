import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

interface PaymentSummaryCardProps {
  activityTitle: string
  sessionDate: string
  sessionTime: string
  sessionDur: string
  childName?: string | null
}

export function PaymentSummaryCard({
  activityTitle,
  sessionDate,
  sessionTime,
  sessionDur,
  childName,
}: PaymentSummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.iconWrap}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{activityTitle}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={colors.gray} />
          <Text style={styles.meta}>{sessionDate} · {sessionTime}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="time-outline" size={13} color={colors.gray} />
          <Text style={styles.meta}>{sessionDur}</Text>
        </View>
        {childName && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={13} color={colors.gray} />
            <Text style={styles.meta}>For {childName}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  summaryCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  meta: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  dot: { color: colors.border, fontSize: fontSize.body },
})
