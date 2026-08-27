import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useAuth } from '@/lib/AuthContext'
import { useActivities } from '@/hooks/useActivities'
import { useBookings } from '@/hooks/useBookings'
import { useChildren } from '@/hooks/useChildren'
import { useQueryClient } from '@tanstack/react-query'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { useSavedActivities } from '@/lib/SavedActivitiesContext'
import { Skeleton } from '@/components/Skeleton'
import { PromoBannerCarousel } from '@/components/home/PromoBannerCarousel'
import { ActivityCard } from '@/components/home/ActivityCard'
import { WatchAndLearnRow } from '@/components/home/WatchAndLearnRow'
import { HomeHeader } from '@/components/home/HomeHeader'
import { UpcomingSessionCard } from '@/components/home/UpcomingSessionCard'
import { TrendingGrid } from '@/components/home/TrendingGrid'
import { VerifiedTeachersSection } from '@/components/home/VerifiedTeachersSection'
import { ClassPacksBanner } from '@/components/home/ClassPacksBanner'
import { LearningMilestonesBanner } from '@/components/home/LearningMilestonesBanner'
import { LocationSheet } from '@/components/LocationSheet'
import type { Activity as ApiActivity } from '@/lib/api'

const CATEGORIES = [
  { id: 'art',     label: 'Art & Craft', filterValue: 'Art & Craft',     icon: 'color-palette-outline', color: colors.coral },
  { id: 'music',   label: 'Music',       filterValue: 'Music',           icon: 'musical-notes-outline', color: colors.navy },
  { id: 'dance',   label: 'Dance',       filterValue: 'Dance',           icon: 'accessibility-outline', color: colors.lavender },
  { id: 'stem',    label: 'STEM',        filterValue: 'STEM',            icon: 'code-slash-outline',    color: colors.primary },
  { id: 'math',    label: 'Math',        filterValue: 'Math & Logic',    icon: 'calculator-outline',    color: colors.navy },
  { id: 'stories', label: 'Stories',     filterValue: 'Storytelling',    icon: 'book-outline',          color: colors.success },
  { id: 'yoga',    label: 'Yoga',        filterValue: 'Yoga & Wellness', icon: 'leaf-outline',          color: colors.primary },
  { id: 'cooking', label: 'Cooking',     filterValue: 'Cooking',         icon: 'restaurant-outline',    color: colors.coral },
] as const

const GUEST_INTEREST_CATEGORY_MAP: Record<string, string> = {
  'Art & Craft': 'Art & Craft',
  Sports: 'Dance',
  Music: 'Music',
  Dance: 'Dance',
  STEM: 'STEM',
  Storytelling: 'Storytelling',
  Yoga: 'Yoga & Wellness',
  Cooking: 'Cooking',
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { enabled, state, setLocation } = useLateOnboarding()
  const { recent, wishlist } = useSavedActivities()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [locationSheetOpen, setLocationSheetOpen] = useState(false)
  const [displayCity, setDisplayCity] = useState<string | null>(null)
  const isGuestPersonalized = enabled && !user
  const guestCategory = state.interests.length > 0 ? GUEST_INTEREST_CATEGORY_MAP[state.interests[0]] : undefined

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['activities'] })
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    setRefreshing(false)
  }, [queryClient])

  const activeCat = CATEGORIES.find(c => c.id === selectedCategoryId)

  // Recommended — respects active category filter
  const { data: recommendedData, isLoading: recommendedLoading } = useActivities({
    category: activeCat?.filterValue ?? guestCategory,
    search: searchText || undefined,
    limit: 8,
  })
  const recommended = recommendedData?.items ?? []

  // Trending — always unfiltered, offset to get different cards
  const { data: trendingData } = useActivities({ limit: 8 })
  const trending = trendingData?.items?.slice(4, 8) ?? []

  const { data: upcomingData } = useBookings('confirmed,pending')
  const { data: completedBookingsData } = useBookings('completed')
  const nextSession = upcomingData?.items?.[0] ?? null
  const bookAgainItems = (completedBookingsData?.items ?? []).slice(0, 4)
  const continueExploringItems = recent.slice(0, 4)
  const { data: childrenData } = useChildren()
  const childName = childrenData?.items?.[0]?.firstName ?? null
  const firstName = (user?.user_metadata?.firstName as string | undefined) ?? 'there'
  const city =
    displayCity ??
    (user?.user_metadata?.city as string | undefined) ??
    state.city ??
    'Set location'
  const recommendationTitle = isGuestPersonalized
    ? state.ageBand
      ? `Recommended for ages ${state.ageBand}`
      : 'Recommended for you'
    : childName
      ? `Recommended for ${childName}`
      : 'Recommended for you'
  const heroTitle = childName
    ? `Discover great activities for ${childName}`
    : isGuestPersonalized && state.ageBand
      ? `Explore classes for ages ${state.ageBand}`
      : 'Find the right activity this week'
  const heroSubtitle = isGuestPersonalized
    ? 'Personalise the feed first, then save or book when you are ready.'
    : 'Compare fit, timing, and teaching style before you book.'

  const handleActivityPress = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(root)/activity/${id}`)
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HomeHeader
        firstName={isGuestPersonalized ? 'there' : firstName}
        city={city}
        searchText={searchText}
        onSearchChange={setSearchText}
        onLocationPress={() => setLocationSheetOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Promo banner */}
        <View style={{ marginTop: spacing.lg }}>
          <PromoBannerCarousel />
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Personalised hero</Text>
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={styles.heroPillText}>This week</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
              <Text style={styles.heroPillText}>Verified teachers</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="home-outline" size={14} color={colors.primary} />
              <Text style={styles.heroPillText}>At-home sessions</Text>
            </View>
          </View>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategoryId === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isActive && { borderColor: cat.color, backgroundColor: cat.color + '12' }]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSelectedCategoryId(isActive ? null : cat.id)
                  if (!isActive) router.push({ pathname: '/(root)/explore', params: { category: cat.label } })
                }}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon as any} size={16} color={isActive ? cat.color : colors.gray} />
                <Text style={[styles.catChipText, isActive && { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Upcoming session card */}
        {nextSession && <UpcomingSessionCard session={nextSession} />}

        <View style={styles.weeklyUpdateCard}>
          <View style={styles.weeklyUpdateIcon}>
            <Ionicons name="newspaper-outline" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.weeklyUpdateTitle}>This week on Beam</Text>
            <Text style={styles.weeklyUpdateText}>
              Fresh classes, parent favourites, and safe picks near {city}.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.weeklyUpdateBtn}
            onPress={() => router.push('/(root)/explore')}
            activeOpacity={0.85}
          >
            <Text style={styles.weeklyUpdateBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recommended for {child} ── */}
        <SectionHeader
          title={recommendationTitle}
          onSeeAll={() => router.push('/(root)/explore')}
        />
        {recommendedLoading ? (
          <RecommendedSkeleton />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {recommended.map((activity) => (
              <View key={activity.id} style={styles.recommendedCard}>
                <ActivityCard
                  activity={activity}
                  onPress={() => handleActivityPress(activity.id)}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Trending Activities ── */}
        {trending.length > 0 && (
          <>
            <SectionHeader
              title="Popular This Week"
              icon="flame"
              iconColor={colors.coral}
              onSeeAll={() => router.push('/(root)/explore')}
            />
            <TrendingGrid activities={trending} />
          </>
        )}

        {continueExploringItems.length > 0 && (
          <>
            <SectionHeader
              title="Continue Exploring"
              icon="sparkles"
              iconColor={colors.primary}
              onSeeAll={() => router.push('/(root)/saved')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedRow}
            >
              {continueExploringItems.map((activity) => (
                <View key={activity.id} style={styles.recommendedCard}>
                  <ActivityCard
                    activity={activity as ApiActivity}
                    onPress={() => handleActivityPress(activity.id)}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {bookAgainItems.length > 0 && (
          <>
            <SectionHeader
              title="Book Again"
              icon="refresh-circle"
              iconColor={colors.success}
              onSeeAll={() => router.push('/(root)/bookings')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedRow}
            >
              {bookAgainItems
                .filter((booking) => booking.activityId)
                .map((booking) => (
                  <View key={booking.id} style={styles.recommendedCard}>
                    <ActivityCard
                      activity={{
                        id: booking.activityId!,
                        title: booking.activityTitle ?? 'Activity',
                        description: '',
                        ageGroup: '',
                        sessionType: booking.sessionType ?? '1:1',
                        sessionDurationMins: booking.activityDuration ?? 0,
                        pricePerSession: booking.totalAmount,
                        imageUrl: booking.activityImage,
                        tags: [],
                        categoryId: '',
                        categoryName: 'Past booking',
                        categoryColor: null,
                        totalBookings: 0,
                        avgRating: null,
                      }}
                      onPress={() => router.push(`/(root)/slots/${booking.activityId}`)}
                    />
                  </View>
                ))}
            </ScrollView>
          </>
        )}

        {/* ── Verified Teachers ── */}
        <SectionHeader
          title="Verified Teachers"
          icon="checkmark-circle"
          iconColor={colors.primary}
          onSeeAll={() => router.push('/(root)/explore')}
        />
        <VerifiedTeachersSection />

        {/* ── Class Packs banner ── */}
        <View style={{ marginTop: spacing.xl }}>
          <ClassPacksBanner />
        </View>

        {/* ── Learning Milestones banner ── */}
        <View style={{ marginTop: spacing.md }}>
          <LearningMilestonesBanner />
        </View>

        {wishlist.length > 0 && (
          <TouchableOpacity
            style={styles.savedSummary}
            onPress={() => router.push('/(root)/saved')}
            activeOpacity={0.88}
          >
            <View style={styles.savedSummaryIcon}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedSummaryTitle}>Saved for later</Text>
              <Text style={styles.savedSummaryText}>
                {wishlist.length} activit{wishlist.length === 1 ? 'y' : 'ies'} waiting in Saved.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── Watch & Learn ── */}
        <SectionHeader
          title="Watch & Learn"
          icon="play-circle"
          iconColor={colors.navy}
          onSeeAll={() => router.push('/(root)/reels')}
        />
        <WatchAndLearnRow />
      </ScrollView>

      <LocationSheet
        visible={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        onLocationSet={async (lat, lng, c) => {
          setDisplayCity(c)
          await setLocation({ city: c, lat, lng })
        }}
      />
    </View>
  )
}

// ─────────────────────────────────────────────
// Shared section header
// ─────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  iconColor,
  onSeeAll,
}: {
  title: string
  icon?: string
  iconColor?: string
  onSeeAll?: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon && <Ionicons name={icon as any} size={18} color={iconColor ?? colors.navy} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function RecommendedSkeleton() {
  return (
    <View style={styles.recommendedRow}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={[
            styles.recommendedCard,
            { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
          ]}
        >
          <Skeleton width={200} height={150} radius={0} />
          <View style={{ padding: spacing.sm, gap: spacing.sm }}>
            <Skeleton width="60%" height={12} radius={radius.badge} />
            <Skeleton width="85%" height={16} />
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
              <Skeleton width={20} height={20} radius={radius.avatar} />
              <Skeleton width="50%" height={12} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Skeleton width="45%" height={16} />
              <Skeleton width="30%" height={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F7' },

  categoryChips: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.avatar,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catChipText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  heroPanel: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.mint,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  heroTitle: {
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  heroSubtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: radius.avatar,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  heroPillText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  weeklyUpdateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.navy,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  weeklyUpdateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  weeklyUpdateTitle: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.white,
  },
  weeklyUpdateText: {
    marginTop: 2,
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  weeklyUpdateBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weeklyUpdateBtnText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionTitle: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.navy },
  seeAll: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },

  // Recommended horizontal scroll
  recommendedRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  recommendedCard: {
    width: 200,
  },
  savedSummary: {
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
  savedSummaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  savedSummaryTitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  savedSummaryText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    marginTop: 2,
  },
})
