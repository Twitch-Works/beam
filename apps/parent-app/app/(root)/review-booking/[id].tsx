import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useChildren } from '@/hooks/useChildren'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import {
  MAIN_BOOKING_STEP_LABELS,
  getBookingCancellationCopy,
  getBookingTypeLabel,
} from '@/lib/booking-flow'

export default function ReviewBookingScreen() {
  const insets = useSafeAreaInsets()
  const {
    id,
    bookingType,
    bookingTypeLabel,
    teacherId,
    teacherName,
    slotId,
    date,
    time,
    duration,
    price,
    childId,
    flowId,
  } = useLocalSearchParams<{
    id: string
    bookingType?: string
    bookingTypeLabel?: string
    teacherId?: string
    teacherName?: string
    slotId: string
    date: string
    time: string
    duration?: string
    price?: string
    childId: string
    flowId?: string
  }>()
  const { data: activity } = useActivity(id ?? null)
  const { data: childrenData } = useChildren()

  const selectedChild = useMemo(
    () => (childrenData?.items ?? []).find((child) => child.id === childId) ?? null,
    [childId, childrenData?.items],
  )

  const bookingLabel = bookingTypeLabel ?? getBookingTypeLabel(bookingType)
  const parsedPrice = price ? parseFloat(price) : activity ? parseFloat(activity.pricePerSession) : 0
  const durationMins = duration ? Number(duration) : activity?.sessionDurationMins
  const cancellationCopy = getBookingCancellationCopy(date)
  const locationLabel = activity?.deliveryMode === 'online'
    ? 'Online'
    : [activity?.locality, activity?.city].filter(Boolean).join(', ') || 'At home'

  async function handleContinue() {
    if (!id) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push({
      pathname: '/(root)/payment/[id]',
      params: {
        id,
        bookingType: bookingType ?? '',
        bookingTypeLabel: bookingLabel,
        teacherId: teacherId ?? '',
        teacherName: teacherName ?? '',
        slotId,
        date,
        time,
        duration: durationMins ? String(durationMins) : '',
        price: String(parsedPrice),
        childId,
        flowId: flowId ?? '',
      },
    })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader
        step={4}
        totalSteps={MAIN_BOOKING_STEP_LABELS.length}
        stepLabels={MAIN_BOOKING_STEP_LABELS}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <ActivitySummaryBar
          title={activity?.title ?? '—'}
          teacherName={teacherName ?? null}
          durationMins={durationMins}
          deliveryMode={activity?.deliveryMode}
          price={parsedPrice}
          imageUrl={activity?.imageUrl}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review booking</Text>
          <Text style={styles.cardSubtext}>
            Keep everything obvious before payment: child, slot, booking type, and cancellation expectations.
          </Text>

          <SummaryRow icon="layers-outline" label="Booking type" value={bookingLabel} />
          <SummaryRow
            icon="person-outline"
            label="Child"
            value={selectedChild ? `${selectedChild.firstName} · ${getAge(selectedChild.dateOfBirth)} yrs` : 'Child not found'}
          />
          <SummaryRow icon="calendar-outline" label="Slot" value={`${formatDisplayDate(date)} · ${time ?? '—'}`} />
          <SummaryRow icon="location-outline" label="Location" value={locationLabel} />
          <SummaryRow icon="cash-outline" label="Total" value={`₹${parsedPrice.toFixed(0)}`} highlight />
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.noticeTitle}>Before you pay</Text>
            <Text style={styles.noticeText}>{cancellationCopy}</Text>
            <Text style={styles.noticeText}>Fulfilment details and teacher confirmation will appear in Bookings after checkout.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.88}>
          <Text style={styles.ctaText}>Continue to payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={16} color={highlight ? colors.primary : colors.gray} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
    </View>
  )
}

function getAge(dob?: string | null) {
  if (!dob) return '—'
  const today = new Date()
  const birth = new Date(dob)
  return today.getFullYear() - birth.getFullYear()
}

function formatDisplayDate(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  cardSubtext: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryLabel: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  summaryValue: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy, maxWidth: '55%', textAlign: 'right' },
  summaryValueHighlight: { color: colors.primary, fontSize: fontSize.bodyLg },
  noticeCard: {
    backgroundColor: colors.mint,
    marginHorizontal: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  noticeTitle: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.primary },
  noticeText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.primary, lineHeight: 20 },
  bottomBar: {
    backgroundColor: '#F6F4EF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  ctaBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  ctaText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
})
