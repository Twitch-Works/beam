import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Skeleton } from '@/components/Skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { InfoRow } from '@/components/InfoRow'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '@/lib/api'
import type { Booking } from '@/lib/api'

function BookingDetailSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 32 }}>
      {/* Hero card */}
      <View style={{ backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card }}>
        <Skeleton width="100%" height={160} radius={0} />
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Skeleton width="60%" height={22} />
            <Skeleton width={72} height={22} radius={radius.badge} />
          </View>
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      {/* Session details card */}
      {[0, 1].map((ci) => (
        <View key={ci} style={{ backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.md, gap: spacing.md, ...shadows.card }}>
          <Skeleton width="45%" height={18} />
          {[0, 1, 2, 3].map((ri) => (
            <View key={ri} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Skeleton width={36} height={36} radius={radius.input} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="30%" height={11} />
                <Skeleton width="55%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Skeleton width="100%" height={48} radius={radius.button} />
    </ScrollView>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)

  const { data: booking, isLoading, isError } = useQuery<Booking>({
    queryKey: ['booking', id, user?.id],
    queryFn: () => parentApi.bookings.get(id!, user!.id),
    enabled: !!id && !!user?.id,
    staleTime: 1000 * 30,
  })

  const teacherName = booking?.teacherFirstName
    ? `${booking.teacherFirstName} ${booking.teacherLastName ?? ''}`.trim()
    : '—'

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!user || !id) return
            setCancelling(true)
            try {
              await parentApi.bookings.cancel(id, user.id)
              await queryClient.invalidateQueries({ queryKey: ['booking', id] })
              await queryClient.invalidateQueries({ queryKey: ['bookings'] })
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } catch (err: any) {
              Alert.alert('Could not cancel', err?.message ?? 'Please try again.')
            } finally {
              setCancelling(false)
            }
          },
        },
      ],
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Booking Details" onBack={() => router.back()} />

      {isLoading ? (
        <BookingDetailSkeleton />
      ) : isError || !booking ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Couldn't load booking</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* Activity image + title */}
          <View style={styles.heroCard}>
            <Image
              source={booking.activityImage ? { uri: booking.activityImage } : require('../../../assets/images/icon.png')}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                <Text style={styles.heroTitle} numberOfLines={2}>{booking.activityTitle ?? '—'}</Text>
                {booking.status && <StatusBadge status={booking.status} />}
              </View>
              <Text style={styles.bookingId}>Booking #{booking.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Session info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Details</Text>
            <InfoRow icon="calendar-outline"   label="Date"     value={formatDate(booking.scheduledAt)} />
            <InfoRow icon="time-outline"        label="Time"     value={formatTime(booking.scheduledAt)} />
            {booking.activityDuration && (
              <InfoRow icon="hourglass-outline" label="Duration" value={`${booking.activityDuration} minutes`} />
            )}
            <InfoRow icon="repeat-outline"     label="Type"     value={booking.sessionType ?? '1:1'} />
          </View>

          {/* Teacher info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Teacher</Text>
            <TouchableOpacity
              style={styles.teacherRow}
              onPress={async () => {
                if (!booking.teacherId) return
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push(`/(root)/teacher/${booking.teacherId}`)
              }}
              disabled={!booking.teacherId}
              activeOpacity={booking.teacherId ? 0.7 : 1}
            >
              {booking.teacherFirstName ? (
                <Avatar firstName={booking.teacherFirstName} lastName={booking.teacherLastName} size={44} colorIndex={0} />
              ) : (
                <Avatar firstName="?" size={44} colorIndex={0} />
              )}
              <Text style={styles.teacherName}>{teacherName}</Text>
              {booking.teacherId && (
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              )}
            </TouchableOpacity>
          </View>

          {/* Payment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total paid</Text>
              <Text style={styles.paymentAmount}>₹{parseFloat(booking.totalAmount).toFixed(0)}</Text>
            </View>
          </View>

          {/* Actions */}
          {booking.status === 'completed' && booking.activityId && (
            <Button
              variant="secondary"
              icon="refresh-outline"
              label="Rebook this activity"
              onPress={() => router.push(`/(root)/slots/${booking.activityId}`)}
            />
          )}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling
                ? <ActivityIndicator color={colors.coral} />
                : <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              }
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  backLink: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  scroll: { padding: spacing.md, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroImage: { width: '100%', height: 160 },
  heroBody: { padding: spacing.md, gap: spacing.xs },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroTitle: {
    flex: 1,
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  bookingId: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherName: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  paymentAmount: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  cancelBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.coral,
  },
})
