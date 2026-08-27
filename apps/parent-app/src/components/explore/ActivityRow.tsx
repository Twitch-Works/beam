import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import type { Activity as ApiActivity } from '@/lib/api'
import { useSavedActivities } from '@/lib/SavedActivitiesContext'

interface ActivityRowProps {
  item: ApiActivity
  onPress: () => void
  nearMe: boolean
  nextAvailableLabel?: string | null
  fitLabel?: string | null
  formatBadge?: string | null
  settingBadge?: string | null
}

export const ActivityRow = React.memo(function ActivityRow({
  item,
  onPress,
  nearMe,
  nextAvailableLabel,
  fitLabel,
  formatBadge,
  settingBadge,
}: ActivityRowProps) {
  const { isWishlisted, toggleWishlist } = useSavedActivities()
  const liked = isWishlisted(item.id)
  const ratingLabel = item.avgRating ? parseFloat(item.avgRating).toFixed(1) : 'New'
  const localityLabel =
    nearMe && item.distanceKm != null
      ? `${item.distanceKm.toFixed(1)} km away`
      : 'Available in your area'
  const proofLabel = item.totalBookings > 0 ? `${item.totalBookings} parent bookings` : 'New on Beam'

  return (
    <TouchableOpacity style={styles.rowCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../../../assets/images/icon.png')}
        style={styles.rowImage}
        contentFit="cover"
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowCategory}>{item.categoryName ?? '—'} · {localityLabel}</Text>
        <View style={styles.rowMeta}>
          <View style={styles.primaryBadge}>
            <Text style={styles.ageBadgeText}>{item.ageGroup}</Text>
          </View>
          {fitLabel ? (
            <View style={styles.fitBadge}>
              <Text style={styles.fitBadgeText}>{fitLabel}</Text>
            </View>
          ) : null}
          {formatBadge ? (
            <View style={styles.secondaryBadge}>
              <Text style={styles.secondaryBadgeText}>{formatBadge}</Text>
            </View>
          ) : null}
          {settingBadge ? (
            <View style={styles.secondaryBadge}>
              <Text style={styles.secondaryBadgeText}>{settingBadge}</Text>
            </View>
          ) : null}
          <View style={styles.secondaryBadge}>
            <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
            <Text style={styles.secondaryBadgeText}>Verified by Beam</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.gray} />
          <Text style={styles.infoText}>{nextAvailableLabel ?? 'Next slot visible after opening details'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={colors.gray} />
          <Text style={styles.infoText}>{item.sessionDurationMins} min</Text>
          <Text style={styles.infoDivider}>·</Text>
          <Text style={styles.infoText}>₹{parseFloat(item.pricePerSession).toFixed(0)}</Text>
          <Text style={styles.infoDivider}>·</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.yellow} />
            <Text style={styles.ratingText}>{ratingLabel}</Text>
          </View>
        </View>
        <Text style={styles.proofText}>{proofLabel}</Text>
      </View>
      <View style={styles.trailing}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            await toggleWishlist({
              id: item.id,
              title: item.title,
              imageUrl: item.imageUrl,
              pricePerSession: item.pricePerSession,
              ageGroup: item.ageGroup,
              categoryName: item.categoryName,
              sessionDurationMins: item.sessionDurationMins,
              avgRating: item.avgRating,
            })
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={liked ? 'bookmark' : 'bookmark-outline'} size={18} color={liked ? colors.primary : colors.border} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color={colors.border} style={{ alignSelf: 'center' }} />
      </View>
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
  trailing: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  saveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
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
  primaryBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.badge,
  },
  ageBadgeText: { fontSize: fontSize.micro, color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  fitBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.badge,
  },
  fitBadgeText: { fontSize: fontSize.micro, color: '#92400E', fontFamily: 'Nunito-SemiBold' },
  secondaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.badge,
  },
  secondaryBadgeText: { fontSize: fontSize.micro, color: colors.navy, fontFamily: 'Nunito-SemiBold' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  infoText: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-Regular' },
  infoDivider: { fontSize: fontSize.caption, color: colors.border, fontFamily: 'Nunito-Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: fontSize.micro, color: colors.gray, fontFamily: 'Nunito-Regular' },
  proofText: { fontSize: fontSize.micro, color: colors.gray, fontFamily: 'Nunito-Regular', marginTop: 4 },
})
