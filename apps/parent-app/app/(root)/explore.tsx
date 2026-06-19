import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { useActivities } from '@/hooks/useActivities'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useAuth } from '@/lib/AuthContext'
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

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [nearMe, setNearMe] = useState(false)
  const [locationSheetOpen, setLocationSheetOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = user?.user_metadata?.lat as number | undefined
    const lng = user?.user_metadata?.lng as number | undefined
    return lat && lng ? { lat, lng } : null
  })

  const categoryParamApplied = useRef(false)
  useEffect(() => {
    if (categoryParam && !categoryParamApplied.current) {
      const match = CATEGORIES.find(c => c.label.toLowerCase() === categoryParam.toLowerCase())
      if (match) setActiveCategory(match.id)
      categoryParamApplied.current = true
    }
  }, [categoryParam])

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
    search: debouncedQuery || undefined,
    limit: 50,
    lat: nearMe && userLocation ? userLocation.lat : undefined,
    lng: nearMe && userLocation ? userLocation.lng : undefined,
    radiusKm: nearMe ? 10 : undefined,
  })
  const activities = data?.items ?? []
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetch()
  })

  const handlePress = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(root)/activity/${id}`)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: ApiActivity }) => (
      <ActivityRow item={item} onPress={() => handlePress(item.id)} nearMe={nearMe} />
    ),
    [handlePress, nearMe],
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBox}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Explore</Text>
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
            : `${activities.length} ${activeCategory !== 'all' ? (activecat?.label ?? '') + ' ' : ''}activit${activities.length === 1 ? 'y' : 'ies'}${nearMe ? ' near you' : ''}`}
        </Text>
      </View>

      {isLoading ? (
        <ExploreSkeleton />
      ) : (
        <FlashList
          data={activities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              title="No activities found"
              subtitle="Try a different category or search term"
              action={{ label: 'Clear filters', onPress: () => { setQuery(''); setActiveCategory('all'); setNearMe(false) } }}
            />
          }
        />
      )}

      <LocationSheet
        visible={locationSheetOpen}
        onClose={() => setLocationSheetOpen(false)}
        onLocationSet={(lat, lng) => handleLocationSet(lat, lng)}
      />
    </View>
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
})
