import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import type { Activity as ApiActivity } from '@/lib/api'

interface ActivityRowProps {
  item: ApiActivity
  onPress: () => void
  nearMe: boolean
}

export const ActivityRow = React.memo(function ActivityRow({ item, onPress, nearMe }: ActivityRowProps) {
  return (
    <TouchableOpacity style={styles.rowCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../../../assets/images/icon.png')}
        style={styles.rowImage}
        contentFit="cover"
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowCategory}>{item.categoryName ?? '—'}</Text>
        <View style={styles.rowMeta}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>{item.ageGroup}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.yellow} />
            <Text style={styles.ratingText}>
              {item.avgRating ? parseFloat(item.avgRating).toFixed(1) : 'New'}
            </Text>
          </View>
          {nearMe && item.distanceKm != null && (
            <View style={styles.distancePill}>
              <Ionicons name="location" size={10} color={colors.primary} />
              <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)} km</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowPrice}>
          ₹{parseFloat(item.pricePerSession).toFixed(0)}{' '}
          <Text style={styles.perSession}>/session</Text>
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rowImage: { width: 90, height: 90, borderRadius: radius.card },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  rowCategory: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-Regular' },
  rowMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  ageBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.badge,
  },
  ageBadgeText: { fontSize: fontSize.micro, color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: fontSize.micro, color: colors.gray, fontFamily: 'Nunito-Regular' },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.badge,
  },
  distanceText: { fontSize: fontSize.micro, color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  rowPrice: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginTop: 2,
  },
  perSession: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
  },
})
