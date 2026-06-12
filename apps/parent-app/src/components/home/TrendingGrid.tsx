import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import type { Activity } from '@/lib/api'

interface TrendingGridProps {
  activities: Activity[]
}

export const TrendingGrid = React.memo(function TrendingGrid({ activities }: TrendingGridProps) {
  const items = activities.slice(0, 4)

  if (!items.length) return null

  return (
    <View style={styles.grid}>
      {items.map((activity, i) => (
        <TrendingCard key={activity.id} activity={activity} index={i} />
      ))}
    </View>
  )
})

const TrendingCard = React.memo(function TrendingCard({
  activity,
  index,
}: {
  activity: Activity
  index: number
}) {
  const price = parseFloat(activity.pricePerSession).toFixed(0)

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(root)/activity/${activity.id}`)
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
      <Image
        source={
          activity.imageUrl
            ? { uri: activity.imageUrl }
            : require('../../../assets/images/icon.png')
        }
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.badge}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {activity.categoryName} · {activity.ageGroup}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.title} numberOfLines={2}>{activity.title}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    ...shadows.card,
  },
  image: { width: '100%', height: 130 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
    top: 0,
    bottom: 52,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.badge,
    maxWidth: '85%',
  },
  badgeText: {
    fontSize: fontSize.micro,
    fontFamily: 'Nunito-SemiBold',
    color: colors.white,
  },
  cardFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    lineHeight: 18,
  },
  price: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
})
