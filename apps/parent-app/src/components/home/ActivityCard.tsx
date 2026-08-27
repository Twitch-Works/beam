import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import type { Activity as ApiActivity } from '@/lib/api'
import { useSavedActivities } from '@/lib/SavedActivitiesContext'

interface ActivityCardProps {
  activity: ApiActivity
  onPress: () => void
}

export const ActivityCard = React.memo(function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const price = parseFloat(activity.pricePerSession).toFixed(0)
  const rating = activity.avgRating ? parseFloat(activity.avgRating).toFixed(1) : null
  const { isWishlisted, toggleWishlist } = useSavedActivities()
  const liked = isWishlisted(activity.id)
  const deliveryLabel = activity.deliveryMode === 'online' ? 'Online' : 'At Home'
  const deliveryIcon = activity.deliveryMode === 'online' ? 'videocam-outline' : 'home-outline'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.cardImageWrap}>
        <Image
          source={
            activity.imageUrl
              ? { uri: activity.imageUrl }
              : require('../../../assets/images/icon.png')
          }
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.atHomeBadge}>
          <Ionicons name={deliveryIcon as any} size={11} color={colors.navy} />
          <Text style={styles.atHomeText}>{deliveryLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            await toggleWishlist({
              id: activity.id,
              title: activity.title,
              imageUrl: activity.imageUrl,
              pricePerSession: activity.pricePerSession,
              ageGroup: activity.ageGroup,
              categoryName: activity.categoryName,
              sessionDurationMins: activity.sessionDurationMins,
              avgRating: activity.avgRating,
            })
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? colors.coral : colors.gray} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {activity.categoryName ?? '—'} · {activity.ageGroup}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{activity.title}</Text>
        <View style={styles.cardTeacherRow}>
          <View style={styles.cardTeacherAvatar}>
            <Ionicons name="person" size={12} color={colors.white} />
          </View>
          {rating !== null ? (
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={11} color={colors.yellow} />
              <Text style={styles.cardRatingText}>{rating}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₹{price}</Text>
          <Text style={styles.cardDuration}>{activity.sessionDurationMins} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 160 },
  atHomeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.avatar,
  },
  atHomeText: { fontSize: fontSize.micro, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: spacing.md, gap: spacing.xs + 1 },
  cardMeta: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  cardTitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    lineHeight: 20,
  },
  cardTeacherRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTeacherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto' as any,
  },
  cardRatingText: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPrice: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  cardDuration: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
})
