import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, ErrorState, LoadingState } from '../../src/components/StateViews'
import { useNotifications, useMarkAllNotificationsRead, type NotificationRow } from '../../src/hooks/useNotifications'
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../../src/constants/theme'

type NotifType = 'booking' | 'reminder' | 'payout' | 'cancel'

const TYPE_CONFIG: Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; fg: string; wrapStyle: string }> = {
  booking:  { icon: 'calendar',     fg: colors.primary,     wrapStyle: 'iconWrapBooking' },
  reminder: { icon: 'time',         fg: colors.warning,     wrapStyle: 'iconWrapReminder' },
  payout:   { icon: 'cash',         fg: colors.successDark, wrapStyle: 'iconWrapPayout' },
  cancel:   { icon: 'close-circle', fg: colors.error,       wrapStyle: 'iconWrapCancel' },
}

function toNotifType(raw: string): NotifType {
  if (raw.startsWith('payout')) return 'payout'
  if (raw.startsWith('booking.cancel') || raw.startsWith('session.cancel') || raw.startsWith('verification.reject')) return 'cancel'
  if (raw.startsWith('session.reminder') || raw.startsWith('session.start')) return 'reminder'
  return 'booking'
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const NotifRow = React.memo(function NotifRow({ notif }: { notif: NotificationRow }) {
  const type = toNotifType(notif.type)
  const cfg = TYPE_CONFIG[type]
  const wrapStyle = styles[cfg.wrapStyle as keyof typeof styles] as object
  return (
    <View style={[styles.row, !notif.isRead && styles.rowUnread]}>
      <View style={[styles.iconWrap, wrapStyle]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.fg} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{notif.title}</Text>
          {!notif.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.body} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.time}>{relativeTime(notif.createdAt)}</Text>
      </View>
    </View>
  )
})

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()

  const renderItem = React.useCallback(
    ({ item }: { item: NotificationRow }) => <NotifRow notif={item} />,
    []
  )

  const unreadCount = data?.unreadCount ?? 0

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading && <LoadingState message="Loading notifications" />}
      {isError && <ErrorState message="Couldn't load notifications" onRetry={refetch} />}
      {!isLoading && !isError && (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState message="No notifications yet" />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  headerSpacer: { width: 80 },
  markAllBtn: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  markAllText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, ...shadows.card,
  },
  rowUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconWrapBooking:  { backgroundColor: colors.mint },
  iconWrapReminder: { backgroundColor: colors.warningBg },
  iconWrapPayout:   { backgroundColor: colors.successBg },
  iconWrapCancel:   { backgroundColor: colors.statusCancelledBg },
  content: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  body: { color: colors.gray, fontSize: fontSize.caption, lineHeight: 17 },
  time: { color: colors.gray, fontSize: 10 },
  separator: { height: spacing.sm },
})
