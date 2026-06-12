import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useBookings } from '@/hooks/useBookings'
import { BookingCard, isLiveBooking } from '@/components/bookings/BookingCard'
import { Avatar } from '@/components/Avatar'
import type { Booking as ApiBooking } from '@/lib/api'

type Tab = 'Upcoming' | 'Completed' | 'Cancelled'
const TABS: Tab[] = ['Upcoming', 'Completed', 'Cancelled']

function EmptyBookings({ tab }: { tab: Tab }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="calendar-outline" size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>No {tab.toLowerCase()} bookings</Text>
      <Text style={styles.emptySubtitle}>
        {tab === 'Upcoming'
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
        onPress={() => Alert.alert('Track', 'Live tracking coming soon.')}
        activeOpacity={0.85}
      >
        <Text style={styles.trackingBtnText}>Track</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming')

  const { data: upcomingData, isLoading: loadingUpcoming } = useBookings('pending,confirmed')
  const { data: completedData, isLoading: loadingCompleted } = useBookings('completed')
  const { data: cancelledData, isLoading: loadingCancelled } = useBookings('cancelled')

  const upcomingItems: ApiBooking[] = upcomingData?.items ?? []
  const completedItems: ApiBooking[] = completedData?.items ?? []
  const cancelledItems: ApiBooking[] = cancelledData?.items ?? []

  const activeItems =
    activeTab === 'Upcoming' ? upcomingItems :
    activeTab === 'Completed' ? completedItems :
    cancelledItems

  const isLoading =
    activeTab === 'Upcoming' ? loadingUpcoming :
    activeTab === 'Completed' ? loadingCompleted :
    loadingCancelled

  const liveBooking = upcomingItems.find(isLiveBooking) ?? null

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab
          const count =
            tab === 'Upcoming' ? upcomingItems.length :
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
      >
        {/* Teacher tracking banner — shown when a session is live */}
        {activeTab === 'Upcoming' && liveBooking && (
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
