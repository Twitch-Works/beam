import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useBookings } from '@/hooks/useBookings'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useAuth } from '@/lib/AuthContext'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { BookingCard, isLiveBooking } from '@/components/bookings/BookingCard'
import { Avatar } from '@/components/Avatar'
import { LoginRequiredState } from '@/components/LoginRequiredState'
import type { Booking as ApiBooking } from '@/lib/api'

type Tab = 'Today' | 'Upcoming' | 'Completed' | 'Cancelled'
const TABS: Tab[] = ['Today', 'Upcoming', 'Completed', 'Cancelled']

function EmptyBookings({ tab }: { tab: Tab }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="calendar-outline" size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>No {tab.toLowerCase()} bookings</Text>
      <Text style={styles.emptySubtitle}>
        {tab === 'Today'
          ? 'Sessions happening today will appear here.'
          : tab === 'Upcoming'
          ? 'Book a session to get started!'
          : tab === 'Completed'
          ? 'Completed sessions will appear here.'
          : 'Cancelled bookings will appear here.'}
      </Text>
    </View>
  )
}

function TeacherTrackingBanner({ booking }: { booking: ApiBooking }) {
  const teacherName = booking.teacherFirstName ?? 'Your teacher'
  return (
    <View style={styles.trackingBanner}>
      <View style={styles.trackingAvatarWrap}>
        <Avatar
          firstName={booking.teacherFirstName ?? '?'}
          lastName={booking.teacherLastName}
          size={48}
          colorIndex={1}
        />
        <View style={styles.onlineDot} />
      </View>
      <View style={styles.trackingInfo}>
        <Text style={styles.trackingName}>{teacherName} is on the way!</Text>
        <Text style={styles.trackingEta}>ETA: 12 minutes · Your location</Text>
      </View>
      <TouchableOpacity
        style={styles.trackingBtn}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push(`/(root)/booking/${booking.id}`)
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.trackingBtnText}>
          {booking.status === 'in_progress' ? 'Open Class' : 'Enter OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const { enabled } = useLateOnboarding()
  const [activeTab, setActiveTab] = useState<Tab>('Today')

  if (!session && enabled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
        </View>
        <LoginRequiredState
          title="Login when you're ready to book"
          subtitle="You can explore first. We only need login once you want to view or manage bookings."
          redirectTo="/(root)/bookings"
        />
      </View>
    )
  }

  const {
    data: upcomingData,
    isLoading: loadingUpcoming,
    refetch: refetchUpcoming,
  } = useBookings('pending,confirmed,in_progress,rescheduled')
  const {
    data: completedData,
    isLoading: loadingCompleted,
    refetch: refetchCompleted,
  } = useBookings('completed')
  const {
    data: cancelledData,
    isLoading: loadingCancelled,
    refetch: refetchCancelled,
  } = useBookings('cancelled')
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([
      refetchUpcoming(),
      refetchCompleted(),
      refetchCancelled(),
    ])
  })

  const upcomingItems: ApiBooking[] = upcomingData?.items ?? []
  const completedItems: ApiBooking[] = completedData?.items ?? []
  const cancelledItems: ApiBooking[] = cancelledData?.items ?? []
  const todayKey = new Date().toDateString()

  const todayItems = useMemo(
    () =>
      upcomingItems.filter((booking) => {
        if (!booking.scheduledAt) {
          return false
        }

        return new Date(booking.scheduledAt).toDateString() === todayKey
      }),
    [todayKey, upcomingItems],
  )

  const futureUpcomingItems = useMemo(
    () =>
      upcomingItems.filter((booking) => {
        if (!booking.scheduledAt) {
          return true
        }

        return new Date(booking.scheduledAt).toDateString() !== todayKey
      }),
    [todayKey, upcomingItems],
  )

  const activeItems =
    activeTab === 'Today' ? todayItems :
    activeTab === 'Upcoming' ? futureUpcomingItems :
    activeTab === 'Completed' ? completedItems :
    cancelledItems

  const isLoading =
    activeTab === 'Today' ? loadingUpcoming :
    activeTab === 'Upcoming' ? loadingUpcoming :
    activeTab === 'Completed' ? loadingCompleted :
    loadingCancelled

  const liveBooking = upcomingItems.find(isLiveBooking) ?? null

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Upcoming, today, completed, and rescheduled sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab
          const count =
            tab === 'Today' ? todayItems.length :
            tab === 'Upcoming' ? futureUpcomingItems.length :
            tab === 'Completed' ? completedItems.length :
            cancelledItems.length
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.tabActive]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setActiveTab(tab)
              }}
              activeOpacity={0.8}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
                {count > 0 && (
                  <View style={[styles.badge, active && styles.badgeActive]}>
                    <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryPill}>
            <Ionicons name="today-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{todayItems.length} today</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{futureUpcomingItems.length} upcoming</Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
            <Text style={styles.summaryPillText}>{completedItems.length} completed</Text>
          </View>
        </View>

        {/* Teacher tracking banner — shown when a session is live */}
        {(activeTab === 'Today' || activeTab === 'Upcoming') && liveBooking && (
          <TeacherTrackingBanner booking={liveBooking} />
        )}

        {isLoading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptySubtitle}>Loading…</Text>
          </View>
        ) : activeItems.length === 0 ? (
          <EmptyBookings tab={activeTab} />
        ) : (
          activeItems.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tabText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  tabTextActive: { color: colors.primary, fontFamily: 'Nunito-Bold' },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeActive: { backgroundColor: colors.primary },
  badgeText: { fontSize: fontSize.micro, fontFamily: 'Nunito-Bold', color: colors.gray },
  badgeTextActive: { color: colors.white },

  scroll: { padding: spacing.md, gap: spacing.md },
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

  // Teacher tracking banner
  trackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.mint,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    ...shadows.card,
  },
  trackingAvatarWrap: { position: 'relative' },
  trackingAvatar: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: colors.white,
  },
  trackingInfo: { flex: 1 },
  trackingName: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  trackingEta: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.primary, marginTop: 2 },
  trackingBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  trackingBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.white },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'] ?? 48,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  emptySubtitle: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, textAlign: 'center' },
})
