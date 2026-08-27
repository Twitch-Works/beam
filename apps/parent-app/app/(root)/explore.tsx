import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { useActivities } from '@/hooks/useActivities'
import { useActivitySlotPreviews } from '@/hooks/useActivitySlotPreviews'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useAuth } from '@/lib/AuthContext'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { EmptyState } from '@/components/EmptyState'
import { ActivityRow } from '@/components/explore/ActivityRow'
import { ExploreSkeleton } from '@/components/explore/ExploreSkeleton'
import { LocationSheet } from '@/components/LocationSheet'
import type { Activity as ApiActivity } from '@/lib/api'

const CATEGORIES = [
  { id: 'all',     label: 'All',         filterValue: undefined,         icon: 'apps-outline',          color: colors.primary },
  { id: 'art',     label: 'Art & Craft', filterValue: 'Art & Craft',     icon: 'color-palette-outline', color: colors.yellow },
  { id: 'music',   label: 'Music',       filterValue: 'Music',           icon: 'musical-notes-outline', color: colors.coral },
  { id: 'dance',   label: 'Dance',       filterValue: 'Dance',           icon: 'accessibility-outline', color: colors.lavender },
  { id: 'stem',    label: 'STEM',        filterValue: 'STEM',            icon: 'code-slash-outline',    color: colors.primary },
  { id: 'math',    label: 'Math',        filterValue: 'Math & Logic',    icon: 'calculator-outline',    color: colors.navy },
  { id: 'stories', label: 'Stories',     filterValue: 'Storytelling',    icon: 'book-outline',          color: colors.success },
  { id: 'yoga',    label: 'Yoga',        filterValue: 'Yoga & Wellness', icon: 'leaf-outline',          color: colors.primary },
] as const

const AGE_GROUPS = ['2-4', '5-7', '8-10', '10+'] as const
const TIME_OF_DAY_OPTIONS = ['Any', 'Morning', 'Afternoon', 'Evening'] as const
const FORMAT_OPTIONS = ['Any', 'Trial', 'Recurring', 'One-time'] as const
const SETTING_OPTIONS = ['Any', 'Indoor', 'Outdoor'] as const

function inferFormat(activity: ApiActivity) {
  if (activity.activityFormat === 'trial') return 'Trial'
  if (activity.activityFormat === 'recurring') return 'Recurring'
  if (activity.activityFormat === 'one_time') return 'One-time'
  const haystack = `${activity.title} ${(activity.tags ?? []).join(' ')} ${activity.categoryName ?? ''}`.toLowerCase()
  if (haystack.includes('trial')) return 'Trial'
  if (haystack.includes('weekly') || haystack.includes('recurring') || haystack.includes('course') || activity.sessionType === 'group') {
    return 'Recurring'
  }
  return 'One-time'
}

function inferSetting(activity: ApiActivity) {
  if (activity.venueType === 'outdoor') return 'Outdoor'
  if (activity.venueType === 'indoor') return 'Indoor'
  const haystack = `${activity.title} ${(activity.tags ?? []).join(' ')}`.toLowerCase()
  if (haystack.includes('outdoor') || haystack.includes('park') || haystack.includes('field')) return 'Outdoor'
  return 'Indoor'
}

function getSlotTimeBucket(isoLike: string) {
  const hour = new Date(isoLike).getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function formatNextSlot(date: string, startTime: string) {
  const slotDate = new Date(`${date}T${startTime}`)
  const today = new Date()
  const isToday = slotDate.toDateString() === today.toDateString()
  const dayLabel = isToday
    ? 'Today'
    : slotDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = slotDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${dayLabel} · ${timeLabel}`
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { state, setLocation } = useLateOnboarding()
  const { category: categoryParam, search: searchParam } = useLocalSearchParams<{ category?: string; search?: string }>()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [nearMe, setNearMe] = useState(false)
  const [dateFilter, setDateFilter] = useState<'Any' | 'This week'>('This week')
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>(state.ageBand || 'Any')
  const [timeOfDay, setTimeOfDay] = useState<(typeof TIME_OF_DAY_OPTIONS)[number]>('Any')
  const [formatFilter, setFormatFilter] = useState<(typeof FORMAT_OPTIONS)[number]>('Any')
  const [settingFilter, setSettingFilter] = useState<(typeof SETTING_OPTIONS)[number]>('Any')
  const [locationSheetOpen, setLocationSheetOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = (user?.user_metadata?.lat as number | undefined) ?? state.lat ?? undefined
    const lng = (user?.user_metadata?.lng as number | undefined) ?? state.lng ?? undefined
    return lat && lng ? { lat, lng } : null
  })

  const categoryParamApplied = useRef(false)
  const searchParamApplied = useRef(false)
  useEffect(() => {
    if (categoryParam && !categoryParamApplied.current) {
      const match = CATEGORIES.find(c => c.label.toLowerCase() === categoryParam.toLowerCase())
      if (match) setActiveCategory(match.id)
      categoryParamApplied.current = true
    }
  }, [categoryParam])

  useEffect(() => {
    if (searchParam && !searchParamApplied.current) {
      setQuery(searchParam)
      setDebouncedQuery(searchParam)
      searchParamApplied.current = true
    }
  }, [searchParam])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const handleNearMeToggle = useCallback(async () => {
    if (!nearMe && !userLocation) { setLocationSheetOpen(true); return }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setNearMe(v => !v)
  }, [nearMe, userLocation])

  const handleLocationSet = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setNearMe(true)
  }, [])

  const activecat = CATEGORIES.find(c => c.id === activeCategory)
  const { data, isLoading, refetch } = useActivities({
    category: activecat?.filterValue,
    ageGroup: activeAgeGroup !== 'Any' ? activeAgeGroup : undefined,
    search: debouncedQuery || undefined,
    activityFormat:
      formatFilter === 'Trial' ? 'trial' :
      formatFilter === 'Recurring' ? 'recurring' :
      formatFilter === 'One-time' ? 'one_time' :
      undefined,
    venueType:
      settingFilter === 'Indoor' ? 'indoor' :
      settingFilter === 'Outdoor' ? 'outdoor' :
      undefined,
    trialAvailable: formatFilter === 'Trial' ? true : undefined,
    timeOfDay:
      timeOfDay === 'Morning' ? 'morning' :
      timeOfDay === 'Afternoon' ? 'afternoon' :
      timeOfDay === 'Evening' ? 'evening' :
      undefined,
    limit: 50,
    lat: nearMe && userLocation ? userLocation.lat : undefined,
    lng: nearMe && userLocation ? userLocation.lng : undefined,
    radiusKm: nearMe ? 10 : undefined,
  })
  const activities = data?.items ?? []
  const slotPreviewMap = useActivitySlotPreviews(activities.slice(0, 20).map((activity) => activity.id))
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetch()
  })
  const filteredActivities = React.useMemo(() => {
    return activities.filter((activity) => {
      const preview = slotPreviewMap[activity.id]
      const nextSlot = preview?.nextSlot ?? null
      const nextSlotDateTime = nextSlot ? `${nextSlot.date}T${nextSlot.startTime}` : null

      if (dateFilter === 'This week' && !nextSlot) {
        return false
      }

      if (timeOfDay !== 'Any' && (!nextSlotDateTime || getSlotTimeBucket(nextSlotDateTime) !== timeOfDay)) {
        return false
      }
      return true
    })
  }, [activities, dateFilter, slotPreviewMap, timeOfDay])
  const activeFilterCount = [
    activeCategory !== 'all',
    nearMe,
    debouncedQuery.length > 0,
    activeAgeGroup !== 'Any',
    timeOfDay !== 'Any',
    formatFilter !== 'Any',
    settingFilter !== 'Any',
    dateFilter !== 'Any',
  ].filter(Boolean).length

  const handlePress = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(root)/activity/${id}`)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: ApiActivity }) => (
      <ActivityRow
        item={item}
        onPress={() => handlePress(item.id)}
        nearMe={nearMe}
        nextAvailableLabel={
          slotPreviewMap[item.id]?.nextSlot
            ? formatNextSlot(slotPreviewMap[item.id]!.nextSlot!.date, slotPreviewMap[item.id]!.nextSlot!.startTime)
            : 'No slot preview yet'
        }
        fitLabel={activeAgeGroup !== 'Any' && item.ageGroup.includes(activeAgeGroup) ? 'Good fit' : null}
        formatBadge={inferFormat(item)}
        settingBadge={inferSetting(item)}
      />
    ),
    [activeAgeGroup, handlePress, nearMe, slotPreviewMap],
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBox}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Explore</Text>
            <Text style={styles.screenSubtitle}>Search, filter, compare, and shortlist activities.</Text>
          </View>
          <TouchableOpacity
            style={[styles.nearMeBtn, nearMe && styles.nearMeBtnActive]}
            onPress={handleNearMeToggle}
            activeOpacity={0.85}
          >
            <Ionicons name={nearMe ? 'location' : 'location-outline'} size={14} color={nearMe ? colors.white : colors.primary} />
            <Text style={[styles.nearMeText, nearMe && styles.nearMeTextActive]}>Near Me</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities, teachers…"
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSummaryCard}>
        <View style={styles.filterSummaryTop}>
          <Text style={styles.filterSummaryTitle}>Filters</Text>
          <Text style={styles.filterSummaryValue}>{activeFilterCount} active</Text>
        </View>
        <View style={styles.filterPills}>
          <View style={[styles.filterPill, activeCategory !== 'all' && styles.filterPillActive]}>
            <Ionicons name="funnel-outline" size={13} color={activeCategory !== 'all' ? colors.primary : colors.gray} />
            <Text style={[styles.filterPillText, activeCategory !== 'all' && styles.filterPillTextActive]}>
              {activecat?.label ?? 'All categories'}
            </Text>
          </View>
          <View style={[styles.filterPill, nearMe && styles.filterPillActive]}>
            <Ionicons name="location-outline" size={13} color={nearMe ? colors.primary : colors.gray} />
            <Text style={[styles.filterPillText, nearMe && styles.filterPillTextActive]}>
              {nearMe ? 'Near me' : 'Anywhere'}
            </Text>
          </View>
          <View style={[styles.filterPill, dateFilter === 'This week' && styles.filterPillActive]}>
            <Ionicons name="calendar-outline" size={13} color={dateFilter === 'This week' ? colors.primary : colors.gray} />
            <Text style={[styles.filterPillText, dateFilter === 'This week' && styles.filterPillTextActive]}>
              {dateFilter}
            </Text>
          </View>
          <View style={[styles.filterPill, viewMode === 'map' && styles.filterPillActive]}>
            <Ionicons name={viewMode === 'map' ? 'map-outline' : 'list-outline'} size={13} color={viewMode === 'map' ? colors.primary : colors.gray} />
            <Text style={[styles.filterPillText, viewMode === 'map' && styles.filterPillTextActive]}>
              {viewMode === 'map' ? 'Map view' : 'List view'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterRow}>
        {[
          { key: 'This week', label: 'This week' },
          { key: 'Recurring', label: 'Recurring' },
          { key: 'Near me', label: 'Near me' },
        ].map((chip) => {
          const active =
            (chip.key === 'This week' && dateFilter === 'This week') ||
            (chip.key === 'Recurring' && formatFilter === 'Recurring') ||
            (chip.key === 'Near me' && nearMe)
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.quickFilterChip, active && styles.quickFilterChipActive]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                if (chip.key === 'This week') {
                  setDateFilter((current) => current === 'This week' ? 'Any' : 'This week')
                } else if (chip.key === 'Recurring') {
                  setFormatFilter((current) => current === 'Recurring' ? 'Any' : 'Recurring')
                } else {
                  void handleNearMeToggle()
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickFilterChipText, active && styles.quickFilterChipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptionRow}>
        <FilterChip label={activeAgeGroup} active={activeAgeGroup !== 'Any'} onPress={() => {
          const currentIndex = ['Any', ...AGE_GROUPS].indexOf(activeAgeGroup as any)
          const next = ['Any', ...AGE_GROUPS][(currentIndex + 1) % (AGE_GROUPS.length + 1)]
          setActiveAgeGroup(next)
        }} />
        <FilterChip label={timeOfDay} active={timeOfDay !== 'Any'} onPress={() => {
          const currentIndex = TIME_OF_DAY_OPTIONS.indexOf(timeOfDay)
          setTimeOfDay(TIME_OF_DAY_OPTIONS[(currentIndex + 1) % TIME_OF_DAY_OPTIONS.length])
        }} />
        <FilterChip label={formatFilter} active={formatFilter !== 'Any'} onPress={() => {
          const currentIndex = FORMAT_OPTIONS.indexOf(formatFilter)
          setFormatFilter(FORMAT_OPTIONS[(currentIndex + 1) % FORMAT_OPTIONS.length])
        }} />
        <FilterChip label={settingFilter} active={settingFilter !== 'Any'} onPress={() => {
          const currentIndex = SETTING_OPTIONS.indexOf(settingFilter)
          setSettingFilter(SETTING_OPTIONS[(currentIndex + 1) % SETTING_OPTIONS.length])
        }} />
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow} style={styles.catScroll}>
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c.id
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, { backgroundColor: isActive ? c.color : c.color + '22' }, isActive && { borderColor: c.color }]}
              onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCategory(c.id) }}
              activeOpacity={0.8}
            >
              <Ionicons name={c.icon as any} size={14} color={isActive ? colors.white : c.color} />
              <Text style={[styles.catLabel, { color: isActive ? colors.white : c.color }]}>{c.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.resultBar}>
        <View style={[styles.resultAccent, { backgroundColor: activecat?.color ?? colors.primary }]} />
        <Text style={styles.resultCount}>
          {isLoading
            ? 'Searching…'
            : `${filteredActivities.length} ${activeCategory !== 'all' ? (activecat?.label ?? '') + ' ' : ''}activit${filteredActivities.length === 1 ? 'y' : 'ies'}${nearMe ? ' near you' : ''}`}
        </Text>
        <TouchableOpacity
          style={styles.wishlistChip}
          onPress={() => router.push('/(root)/saved')}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={13} color={colors.primary} />
          <Text style={styles.wishlistChipText}>Wishlist</Text>
        </TouchableOpacity>
        <View style={styles.viewToggle}>
          {(['list', 'map'] as const).map((mode) => {
            const active = viewMode === mode
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.viewToggleChip, active && styles.viewToggleChipActive]}
                onPress={() => setViewMode(mode)}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewToggleText, active && styles.viewToggleTextActive]}>
                  {mode === 'list' ? 'List' : 'Map'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {isLoading ? (
        <ExploreSkeleton />
      ) : viewMode === 'map' ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={28} color={colors.primary} />
          <Text style={styles.mapPlaceholderTitle}>Map view</Text>
          <Text style={styles.mapPlaceholderText}>
            Nearby classes are already highlighted in list view. Interactive map view can be layered on top next.
          </Text>
        </View>
      ) : (
        <FlashList
          data={filteredActivities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              title="No activities found"
              subtitle="Try a different age, format, category, or timing filter"
              action={{ label: 'Clear filters', onPress: () => { setQuery(''); setActiveCategory('all'); setNearMe(false); setActiveAgeGroup('Any'); setTimeOfDay('Any'); setFormatFilter('Any'); setSettingFilter('Any'); setDateFilter('This week') } }}
            />
          }
        />
      )}

      <LocationSheet
        visible={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        onLocationSet={async (lat, lng, city) => {
          handleLocationSet(lat, lng)
          await setLocation({ city, lat, lng })
        }}
      />
    </View>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.filterSelectorChip, active && styles.filterSelectorChipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.filterSelectorChipText, active && styles.filterSelectorChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  headerBox: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm },
  screenTitle: { fontSize: fontSize.h1, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.navy },
  screenSubtitle: {
    marginTop: 2,
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  nearMeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.avatar, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white,
  },
  nearMeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  nearMeText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.primary },
  nearMeTextActive: { color: colors.white },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightGray,
    borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: fontSize.body, color: colors.navy, fontFamily: 'Nunito-Regular' },
  filterSummaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSummaryTitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  filterSummaryValue: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.avatar,
    backgroundColor: colors.lightGray,
  },
  filterPillActive: {
    backgroundColor: colors.mint,
  },
  filterPillText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
  },
  filterPillTextActive: {
    color: colors.primary,
  },
  quickFilterRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  quickFilterChip: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.avatar,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickFilterChipActive: {
    backgroundColor: colors.primary,
  },
  quickFilterChipText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  quickFilterChipTextActive: {
    color: colors.white,
  },
  filterOptionRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  filterSelectorChip: {
    backgroundColor: colors.white,
    borderRadius: radius.avatar,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSelectorChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
  },
  filterSelectorChipText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
  },
  filterSelectorChipTextActive: {
    color: colors.primary,
  },
  catScroll: { flexGrow: 0, flexShrink: 0 },
  catRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.avatar, borderWidth: 1.5, borderColor: 'transparent', gap: spacing.xs,
  },
  catLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold' },
  resultBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  resultAccent: { width: 3, height: 14, borderRadius: 2 },
  resultCount: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-SemiBold' },
  wishlistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.badge,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wishlistChipText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  viewToggle: { flexDirection: 'row', gap: spacing.xs },
  viewToggleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.badge,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewToggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  viewToggleText: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  viewToggleTextActive: { color: colors.white },
  mapPlaceholder: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapPlaceholderTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  mapPlaceholderText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
})
