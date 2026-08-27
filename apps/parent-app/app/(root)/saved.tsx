import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, fontSize, radius, spacing, shadows } from '@/constants/theme'
import { useActivities } from '@/hooks/useActivities'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/lib/AuthContext'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { useSavedActivities } from '@/lib/SavedActivitiesContext'
import { LoginRequiredState } from '@/components/LoginRequiredState'
import { ActivityCard } from '@/components/home/ActivityCard'
import type { Activity as ApiActivity } from '@/lib/api'

export default function SavedScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const { enabled } = useLateOnboarding()
  const { wishlist, recent } = useSavedActivities()
  const { data: upcomingData } = useBookings('pending,confirmed,in_progress,rescheduled')
  const { data: activitiesData } = useActivities({ limit: 20 })
  const reminders = upcomingData?.items?.slice(0, 3) ?? []
  const catalogItems = activitiesData?.items ?? []

  const wishlistItems = wishlist
    .map((saved) => catalogItems.find((item) => item.id === saved.id) ?? saved)
    .slice(0, 8)

  const recentlyViewed = recent
    .map((saved) => catalogItems.find((item) => item.id === saved.id) ?? saved)
    .slice(0, 8)

  const toActivityCardModel = React.useCallback((activity: (typeof wishlistItems)[number]): ApiActivity => {
    return {
      id: activity.id,
      title: activity.title,
      description: 'Saved activity',
      ageGroup: activity.ageGroup,
      sessionType: 'home',
      sessionDurationMins: activity.sessionDurationMins,
      pricePerSession: activity.pricePerSession,
      imageUrl: activity.imageUrl,
      tags: [],
      categoryId: 'saved',
      categoryName: activity.categoryName,
      categoryColor: null,
      totalBookings: 0,
      avgRating: activity.avgRating,
      distanceKm: null,
    }
  }, [])

  if (!session && enabled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved</Text>
        </View>
        <LoginRequiredState
          title="Login when you want to save things"
          subtitle="Wishlists, reminders, and shared saves are account-based. You can keep exploring without login."
          redirectTo="/(root)/saved"
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>Wishlist, reminders, and recently viewed</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryPill}>
            <Ionicons name="bookmark-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{wishlistItems.length} in wishlist</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{reminders.length} reminders</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{recentlyViewed.length} viewed recently</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wishlist</Text>
          <TouchableOpacity onPress={() => router.push('/(root)/explore')}>
            <Text style={styles.sectionLink}>Explore more</Text>
          </TouchableOpacity>
        </View>
        {wishlistItems.length === 0 ? (
          <SectionCard
            icon="heart-outline"
            title="No saved activities yet"
            description="Save teachers and activities you want to compare later."
            actionLabel="Start exploring"
            onPress={() => router.push('/(root)/explore')}
          />
        ) : (
          wishlistItems.map((activity) => (
            <View key={activity.id} style={styles.activityWrap}>
              <ActivityCard
                activity={toActivityCardModel(activity)}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  router.push(`/(root)/activity/${activity.id}`)
                }}
              />
            </View>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <TouchableOpacity onPress={() => router.push('/(root)/bookings')}>
            <Text style={styles.sectionLink}>View bookings</Text>
          </TouchableOpacity>
        </View>
        {reminders.length === 0 ? (
          <SectionCard
            icon="notifications-outline"
            title="No reminders yet"
            description="Upcoming bookings and booking deadlines will show here."
          />
        ) : (
          reminders.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.reminderCard}
              onPress={() => router.push(`/(root)/booking/${booking.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{booking.activityTitle ?? 'Upcoming session'}</Text>
                <Text style={styles.cardDescription}>
                  {booking.scheduledAt
                    ? new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Schedule pending'}
                  {' · '}
                  {booking.teacherFirstName ? `with ${booking.teacherFirstName}` : 'Teacher to be assigned'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </TouchableOpacity>
          ))
        )}

        <SectionCard
          icon="people-outline"
          title="Shared with spouse"
          description="Keep shortlisted classes in one place once shared saves are enabled."
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently viewed</Text>
          <TouchableOpacity onPress={() => router.push('/(root)/explore')}>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentlyViewed.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={24} color={colors.gray} />
            <Text style={styles.emptyTitle}>No recent activity yet</Text>
            <Text style={styles.emptySubtitle}>Activities you open will show up here for quick access.</Text>
          </View>
        ) : (
          recentlyViewed.map((activity) => (
            <View key={activity.id} style={styles.activityWrap}>
              <ActivityCard
                activity={toActivityCardModel(activity)}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  router.push(`/(root)/activity/${activity.id}`)
                }}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

function SectionCard({
  icon,
  title,
  description,
  actionLabel,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  description: string
  actionLabel?: string
  onPress?: () => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        {actionLabel && onPress ? (
          <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.h1,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.mint,
    borderRadius: radius.avatar,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  summaryPillText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  cardDescription: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 22,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  sectionLink: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.card,
  },
  emptyTitle: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  emptySubtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  activityWrap: {
    marginTop: spacing.sm,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
})
