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

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [locationSheetOpen, setLocationSheetOpen] = useState(false)
  const [displayCity, setDisplayCity] = useState<string | null>(null)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['activities'] })
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    setRefreshing(false)
  }, [queryClient])

  const activeCat = CATEGORIES.find(c => c.id === selectedCategoryId)

  // Recommended — respects active category filter
  const { data: recommendedData, isLoading: recommendedLoading } = useActivities({
    category: activeCat?.filterValue,
    search: searchText || undefined,
    limit: 8,
  })
  const recommended = recommendedData?.items ?? []

  // Trending — always unfiltered, offset to get different cards
  const { data: trendingData } = useActivities({ limit: 8 })
  const trending = trendingData?.items?.slice(4, 8) ?? []

  const { data: upcomingData } = useBookings('confirmed,pending')
  const nextSession = upcomingData?.items?.[0] ?? null
  const { data: childrenData } = useChildren()
  const childName = childrenData?.items?.[0]?.firstName ?? null
  const firstName = (user?.user_metadata?.firstName as string | undefined) ?? 'there'
  const city = displayCity ?? (user?.user_metadata?.city as string | undefined) ?? 'Set location'

  const handleActivityPress = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(root)/activity/${id}`)
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HomeHeader
        firstName={firstName}
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

        {/* ── Recommended for {child} ── */}
        <SectionHeader
          title={childName ? `Recommended for ${childName}` : 'Recommended for you'}
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
              title="Trending Activities"
              icon="flame"
              iconColor={colors.coral}
              onSeeAll={() => router.push('/(root)/explore')}
            />
            <TrendingGrid activities={trending} />
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
        onLocationSet={(_, __, c) => setDisplayCity(c)}
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
})
