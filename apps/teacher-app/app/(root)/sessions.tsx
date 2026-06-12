import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, ErrorState, LoadingState } from '../../src/components/StateViews'
import { StatusBadge } from '../../src/components/StatusBadge'
import { useTeacherSessions, useUpdateBookingStatus, type SessionItem } from '../../src/hooks/useTeacherSessions'
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../../src/constants/theme'

type TabKey = 'upcoming' | 'completed' | 'pending' | 'cancelled'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_MAP: Record<string, TabKey> = {
  confirmed: 'upcoming',
  completed: 'completed',
  pending: 'pending',
  cancelled: 'cancelled',
}

function SessionCard({ session }: { session: SessionItem }) {
  const updateStatus = useUpdateBookingStatus()
  const initial = session.childName[0]?.toUpperCase() ?? '?'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(root)/session/${session.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={styles.childName}>{session.childName}</Text>
            <StatusBadge status={session.status} />
          </View>
          <Text style={styles.activity}>{session.activityTitle}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.gray} />
            <Text style={styles.meta}>{session.dateLabel} · {session.timeRange}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.gray} />
            <Text style={styles.meta}>{session.location}</Text>
          </View>
        </View>
      </View>
      {session.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={(e) => { e.stopPropagation(); updateStatus.mutate({ bookingId: session.id, status: 'cancelled' }) }}
            disabled={updateStatus.isPending}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={(e) => { e.stopPropagation(); updateStatus.mutate({ bookingId: session.id, status: 'confirmed' }) }}
            disabled={updateStatus.isPending}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function SessionsScreen() {
  const { data, isError, isLoading, refetch } = useTeacherSessions()
  const [activeTab, setActiveTab] = React.useState<TabKey>('upcoming')
  const [search, setSearch] = React.useState('')

  if (isLoading) return <LoadingState message="Loading sessions" />
  if (isError || !data) return <ErrorState message="Couldn't load sessions" onRetry={refetch} />

  const allSessions = [...data.upcoming, ...data.past]
  const filtered = allSessions.filter((s) => {
    const tabMatch = (STATUS_MAP[s.status] ?? 'upcoming') === activeTab
    const q = search.toLowerCase()
    const searchMatch = !q || s.childName.toLowerCase().includes(q) || s.activityTitle.toLowerCase().includes(q)
    return tabMatch && searchMatch
  })

  const renderItem = React.useCallback(
    ({ item }: { item: SessionItem }) => <SessionCard session={item} />,
    []
  )

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.gray} />
        <TextInput
          placeholder="Search sessions or students…"
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Tab strip */}
      <View style={styles.tabStrip}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session list */}
      <FlashList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState message={`No ${activeTab} sessions`} cta="Review availability" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.navy, fontSize: fontSize.h2, fontWeight: fontWeight.bold },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.button, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.navy, fontSize: fontSize.body },
  tabStrip: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    marginTop: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.lightGray,
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  tabLabelActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.primary, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  cardInfo: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  childName: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  activity: { color: colors.gray, fontSize: fontSize.body },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: colors.gray, fontSize: fontSize.caption, flex: 1 },
  separator: { height: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  declineBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
  declineBtnText: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  acceptBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.button, backgroundColor: colors.primary },
  acceptBtnText: { color: colors.white, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
})
