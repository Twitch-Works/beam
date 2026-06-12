import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

interface ActivitySummaryBarProps {
  title: string
  teacherName?: string | null
  durationMins?: number | null
  sessionType?: string | null
  price: number
  imageUrl?: string | null
}

export function ActivitySummaryBar({
  title, teacherName, durationMins, sessionType, price, imageUrl,
}: ActivitySummaryBarProps) {
  const isAtHome = sessionType === 'home'

  return (
    <View style={styles.card}>
      <Image
        source={imageUrl ? { uri: imageUrl } : require('../../../assets/images/icon.png')}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.metaRow}>
          {teacherName && (
            <View style={styles.chip}>
              <Ionicons name="person-outline" size={11} color={colors.gray} />
              <Text style={styles.chipText}>{teacherName}</Text>
            </View>
          )}
          {durationMins && (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={11} color={colors.gray} />
              <Text style={styles.chipText}>{durationMins} min</Text>
            </View>
          )}
          {isAtHome && (
            <View style={styles.chip}>
              <Ionicons name="home-outline" size={11} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>At Home</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.price}>₹{price.toFixed(0)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.sm,
    ...shadows.card,
  },
  thumbnail: {
    width: 56, height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.lightGray,
  },
  info: { flex: 1, gap: 4 },
  title: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText: { fontSize: fontSize.micro, fontFamily: 'Nunito-Regular', color: colors.gray },
  price: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.primary },
})
