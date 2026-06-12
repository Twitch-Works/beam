import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface ActivityReviewsTabProps {
  rating: number | null
  reviewCount: number
}

export function ActivityReviewsTab({ rating, reviewCount }: ActivityReviewsTabProps) {
  return (
    <View style={styles.container}>
      {rating !== null && (
        <View style={styles.ratingOverview}>
          <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
          <View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= Math.floor(rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.yellow}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>{reviewCount} reviews</Text>
          </View>
        </View>
      )}
      <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
      <Text style={styles.emptyText}>No reviews yet</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    padding: spacing.md,
    alignSelf: 'stretch',
  },
  ratingBig: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewCount: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    marginTop: 4,
  },
  emptyText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
})
