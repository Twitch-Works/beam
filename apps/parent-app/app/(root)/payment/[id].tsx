import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Linking, Share,
} from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useChildren } from '@/hooks/useChildren'
import { useAuth } from '@/lib/AuthContext'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { parentApi } from '@/lib/api'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'
import {
  MAIN_BOOKING_STEP_LABELS,
  getBookingCancellationCopy,
  getBookingTypeLabel,
} from '@/lib/booking-flow'

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet'
type PaymentState = 'idle' | 'failed'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, BHIM and bank UPI apps', icon: 'phone-portrait-outline' },
  { id: 'card', label: 'Cards', sub: 'Credit and debit cards', icon: 'card-outline' },
  { id: 'netbanking', label: 'Net banking', sub: 'Continue with your bank account login', icon: 'business-outline' },
  { id: 'wallet', label: 'Wallet / credits', sub: 'Use Beam credits or supported wallets', icon: 'wallet-outline' },
] as const

function formatDisplayDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function shortId(): string {
  return 'BM' + Math.floor(10000 + Math.random() * 90000)
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets()
  const { enabled } = useLateOnboarding()
  const {
    id,
    bookingId: existingBookingId,
    slotId,
    date,
    time,
    price: priceParam,
    childId,
    bookingType,
    bookingTypeLabel,
  } = useLocalSearchParams<{
    id: string
    bookingId?: string
    slotId: string
    date: string
    time: string
    price: string
    childId?: string
    bookingType?: string
    bookingTypeLabel?: string
  }>()

  const { user, parentUserId } = useAuth()
  const { data: activityData } = useActivity(id ?? null)
  const { data: childrenData } = useChildren()
  const selectedChild = childId
    ? (childrenData?.items ?? []).find((child) => child.id === childId) ?? null
    : childrenData?.items?.[0] ?? null
  const isReschedule = !!existingBookingId
  const wizardLabels = isReschedule ? ['Slot', 'Payment'] : MAIN_BOOKING_STEP_LABELS
  const wizardStep = isReschedule ? 2 : 5
  const resolvedBookingTypeLabel = bookingTypeLabel ?? getBookingTypeLabel(bookingType)

  const sessionPrice  = priceParam ? parseFloat(priceParam) : (activityData ? parseFloat(activityData.pricePerSession) : 0)
  const activity      = activityData
  const activityTitle = activity?.title ?? '—'
  const [method, setMethod]           = useState<PaymentMethod>('upi')
  const [couponCode, setCouponCode]   = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount]       = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null)
  const [mockPaymentReference, setMockPaymentReference] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [paymentError, setPaymentError] = useState<string>('')

  React.useEffect(() => {
    if (!user && enabled) {
      router.replace({
        pathname: '/(auth)/login',
        params: {
          redirectTo: `/(root)/payment/${id}?bookingId=${existingBookingId ?? ''}&slotId=${slotId}&date=${date ?? ''}&time=${encodeURIComponent(time ?? '')}&price=${priceParam ?? ''}&childId=${childId ?? ''}&bookingType=${bookingType ?? ''}&bookingTypeLabel=${encodeURIComponent(resolvedBookingTypeLabel)}`,
        },
      })
    }
  }, [bookingType, childId, date, enabled, existingBookingId, id, priceParam, resolvedBookingTypeLabel, slotId, time, user])

  const total = sessionPrice - discount
  const confirmationCopy = `${selectedChild?.firstName ?? 'Your child'} is booked for ${activityTitle}. Please arrive 10 minutes early.`
  const locationText = activity?.deliveryMode === 'online'
    ? 'Online session'
    : [activity?.locality, activity?.city].filter(Boolean).join(', ') || ((user?.user_metadata?.city as string) ?? 'Your area')

  const handleApplyCoupon = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      const result = await parentApi.coupons.validate(couponCode, sessionPrice)
      setDiscount(result.discountAmount)
      setCouponApplied(true)
      setCouponError('')
    } catch (err: any) {
      setCouponApplied(false)
      setDiscount(0)
      setCouponError(err?.message ?? 'Invalid or expired code')
    }
  }

  const handlePay = async () => {
    if (isProcessing || !user || !parentUserId || !id) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsProcessing(true)
    setPaymentState('idle')
    setPaymentError('')
    try {
      if (!selectedChild?.id) { Alert.alert('No child selected', 'Go back and choose the child for this booking.'); return }
      if (!slotId) { Alert.alert('Missing slot', 'Go back and select a slot.'); return }

      if (existingBookingId) {
        const { booking } = await parentApi.bookings.reschedule(existingBookingId, parentUserId, slotId)
        setCompletedBookingId(booking.id)
        setMockPaymentReference(null)
      } else {
        const { booking, payment } = await parentApi.bookings.create({
          parentId: parentUserId, childId: selectedChild.id,
          activityId: id, slotId,
          totalAmount: total,
          discountCode: couponApplied ? couponCode : undefined,
          discountAmount: discount,
        })
        setCompletedBookingId(booking.id)
        setMockPaymentReference(payment.gatewayPaymentId ?? payment.id)
      }
    } catch (err: any) {
      setPaymentState('failed')
      setPaymentError(err?.description ?? err?.message ?? 'Payment did not go through. Your child and slot selection are still saved.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleOpenMap() {
    const target = encodeURIComponent(locationText)
    const url = `https://www.google.com/maps/search/?api=1&query=${target}`
    await Linking.openURL(url)
  }

  async function handleAddToCalendar() {
    if (!date || !time) {
      Alert.alert('Missing slot details', 'Booking time is missing, so calendar export is not available yet.')
      return
    }

    const [hour, minuteWithMeridiem] = time.split(':')
    const [minute, meridiem] = minuteWithMeridiem.split(' ')
    const hours24Raw = Number(hour)
    const hours24 = meridiem === 'PM' && hours24Raw < 12 ? hours24Raw + 12 : meridiem === 'AM' && hours24Raw === 12 ? 0 : hours24Raw
    const start = new Date(`${date}T${String(hours24).padStart(2, '0')}:${minute}:00`)
    const end = new Date(start.getTime() + (activity?.sessionDurationMins ?? 60) * 60 * 1000)
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activityTitle)}&details=${encodeURIComponent(confirmationCopy)}&location=${encodeURIComponent(locationText)}&dates=${formatCalendarDate(start)}/${formatCalendarDate(end)}`
    await Linking.openURL(calendarUrl)
  }

  async function handleShareWithFamily() {
    await Share.share({
      message: `${confirmationCopy} ${date ? `Date: ${formatDisplayDate(date)}` : ''} ${time ? `Time: ${time}` : ''}`.trim(),
    })
  }

  function handleReminderPreferences() {
    Alert.alert('Reminder preferences', '24-hour, 1-hour and 10-minute reminders will stay enabled for this booking.')
  }

  function handleSupport() {
    Alert.alert('Support', 'Beam support can help you complete payment or confirm the slot if the issue persists.')
  }

  // ── Success screen ──
  if (completedBookingId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <BookingWizardHeader
          step={wizardStep}
          totalSteps={wizardLabels.length}
          stepLabels={wizardLabels}
          title="Confirmation"
          onBack={() => {}}
        />
        <ScrollView contentContainerStyle={[styles.successScroll, { paddingBottom: insets.bottom + 100 }]}>
          {/* Check icon */}
          <View style={styles.successIconWrap}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.successTitle}>{existingBookingId ? 'Reschedule Requested!' : 'Booking Confirmed!'}</Text>
          <Text style={styles.successCopy}>{confirmationCopy}</Text>
          <Text style={styles.successSubtitle}>
            {existingBookingId
              ? "Your new slot is pending teacher confirmation."
              : "Your session has been booked with a mock payment capture. You'll receive a confirmation shortly."}
          </Text>

          {/* Receipt card */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Image
                source={activity?.imageUrl ? { uri: activity.imageUrl } : require('../../../assets/images/icon.png')}
                style={styles.receiptThumb}
                contentFit="cover"
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.receiptTitle}>{activityTitle}</Text>
                <Text style={styles.receiptTeacher}>with {selectedChild?.firstName ?? 'your child'}</Text>
              </View>
            </View>
            <View style={styles.receiptDivider} />
            {[
              ...(!isReschedule ? [{ label: 'Booking Type', value: resolvedBookingTypeLabel }] : []),
              { label: 'Date & Time', value: `${date ? formatDisplayDate(date) : '—'}, ${time ?? '—'}` },
              { label: 'Location',    value: locationText },
              { label: 'Amount Paid', value: `₹${total}` },
              ...(mockPaymentReference ? [{ label: 'Mock Payment', value: mockPaymentReference }] : []),
              { label: 'Booking ID',  value: shortId() },
            ].map(row => (
              <View key={row.label} style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>{row.label}</Text>
                <Text style={styles.receiptValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.successActionCard}>
            <Text style={styles.cardTitle}>What you can do now</Text>
            <ActionRow icon="navigate-outline" label="Directions + map" onPress={handleOpenMap} />
            <ActionRow icon="calendar-outline" label="Add to calendar" onPress={handleAddToCalendar} />
            <ActionRow icon="checkbox-outline" label="Preparation checklist" onPress={() => Alert.alert('Preparation checklist', activity?.whatToBring ?? activity?.materialsNeeded ?? 'We will share preparation notes in the booking details.')} />
            <ActionRow icon="share-social-outline" label="Share with family" onPress={handleShareWithFamily} />
            <ActionRow icon="notifications-outline" label="Reminder preferences" onPress={handleReminderPreferences} />
          </View>
        </ScrollView>

        <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace('/(root)/bookings')}
          >
            <Text style={styles.ctaBtnText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (paymentState === 'failed') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <BookingWizardHeader
          step={wizardStep}
          totalSteps={wizardLabels.length}
          stepLabels={wizardLabels}
          title="Payment"
          onBack={() => setPaymentState('idle')}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <ActivitySummaryBar
            title={activityTitle}
            durationMins={activity?.sessionDurationMins}
            deliveryMode={activity?.deliveryMode}
            price={sessionPrice}
            imageUrl={activity?.imageUrl}
          />

          <View style={styles.failureCard}>
            <Text style={styles.failureTitle}>Payment failed</Text>
            <Text style={styles.failureText}>{paymentError || 'Your selected slot is still held for 10 minutes.'}</Text>
            <Text style={styles.failureHint}>We kept your slot, child selection and booking details intact so you can retry without starting over.</Text>

            <View style={styles.failureList}>
              <FailurePoint text="Hold slot for 10 minutes" />
              <FailurePoint text="Retry payment without re-entering child details" />
              <FailurePoint text="Change method and try again" />
              <FailurePoint text="Keep child/profile data intact" />
              <FailurePoint text="Open support if the issue persists" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Try again</Text>
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.id
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodRow, active && styles.methodRowActive]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setMethod(m.id)
                    setPaymentState('idle')
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                    <Ionicons name={m.icon} size={18} color={active ? colors.white : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + spacing.sm, gap: spacing.sm }]}>
          <TouchableOpacity style={styles.secondaryCtaBtn} onPress={handleSupport} activeOpacity={0.88}>
            <Text style={styles.secondaryCtaText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaBtn} onPress={handlePay} activeOpacity={0.88}>
            <Text style={styles.ctaBtnText}>Retry payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Step 3: Review & Pay ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader
        step={wizardStep}
        totalSteps={wizardLabels.length}
        stepLabels={wizardLabels}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Activity bar */}
        <ActivitySummaryBar
          title={activityTitle}
          durationMins={activity?.sessionDurationMins}
          deliveryMode={activity?.deliveryMode}
          price={sessionPrice}
          imageUrl={activity?.imageUrl}
        />

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{existingBookingId ? 'Reschedule Summary' : 'Payment Review'}</Text>
          {[
            ...(!existingBookingId ? [{ icon: 'layers-outline', label: 'Booking type', value: resolvedBookingTypeLabel }] : []),
            { icon: 'calendar-outline',  label: 'Date',  value: date ? formatDisplayDate(date) + ' ' + new Date().getFullYear() : '—' },
            { icon: 'time-outline',      label: 'Time',  value: time ?? '—' },
            { icon: 'home-outline',      label: 'Mode',  value: activity?.deliveryMode === 'online' ? 'Online' : 'At Home' },
            { icon: 'person-outline',    label: 'Child', value: selectedChild ? `${selectedChild.firstName} (${getAge(selectedChild.dateOfBirth)} yrs)` : '—' },
          ].map(row => (
            <View key={row.label} style={styles.summaryRow}>
              <Ionicons name={row.icon as any} size={16} color={colors.gray} />
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Promo Code */}
        <View style={styles.card}>
          <View style={styles.promoHeading}>
            <Ionicons name="pricetag-outline" size={18} color={colors.coral} />
            <Text style={styles.cardTitle}>Offer or referral code</Text>
          </View>
          <Text style={styles.supportingText}>Use the same field for offer codes and referral credits.</Text>
          {couponApplied ? (
            <View style={styles.couponApplied}>
              <Ionicons name="pricetag" size={16} color={colors.success} />
              <Text style={styles.couponAppliedText}>BEAM10 applied — ₹{discount} off!</Text>
              <TouchableOpacity onPress={() => { setCouponCode(''); setCouponApplied(false); setCouponError('') }}>
                <Ionicons name="close-circle" size={18} color={colors.gray} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter code (try BEAM10)"
                placeholderTextColor={colors.gray}
                value={couponCode}
                onChangeText={t => { setCouponCode(t.toUpperCase()); setCouponError('') }}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyBtn, !couponCode && styles.applyBtnDisabled]}
                onPress={handleApplyCoupon}
                disabled={!couponCode}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
          {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment options</Text>
          {PAYMENT_METHODS.map(m => {
            const active = method === m.id
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodRow, active && styles.methodRowActive]}
                onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMethod(m.id) }}
                activeOpacity={0.8}
                >
                  <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                    <Ionicons name={m.icon} size={18} color={active ? colors.white : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
              </TouchableOpacity>
            )
          })}
          <View style={styles.walletHint}>
            <Ionicons name="gift-outline" size={16} color={colors.primary} />
            <Text style={styles.walletHintText}>Beam credits and wallet balance will be applied automatically when available.</Text>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={[styles.card, { gap: spacing.sm }]}>
          <PriceRow label="Session fee"   value={`₹${sessionPrice.toFixed(0)}`} />
          {discount > 0 && <PriceRow label="Discount" value={`−₹${discount}`} valueColor={colors.success} />}
          <PriceRow label="Platform fee"  value="₹0" />
          <View style={styles.divider} />
          <PriceRow label="Total" value={`₹${total}`} bold primary />
        </View>

        {/* Trust line */}
        <View style={styles.trustLine}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.gray} />
          <Text style={styles.trustText}>
            Mock payment only · teacher confirmation required · {getBookingCancellationCopy(date)}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Pay button */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, isProcessing && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={isProcessing}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>
            {isProcessing ? 'Processing…' : existingBookingId ? 'Request Reschedule' : 'Pay securely'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getAge(dob?: string | null) {
  if (!dob) return '—'
  const today = new Date()
  const birth = new Date(dob)
  return today.getFullYear() - birth.getFullYear()
}

function PriceRow({ label, value, bold, primary, valueColor }: {
  label: string; value: string; bold?: boolean; primary?: boolean; valueColor?: string
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && { fontFamily: 'Nunito-Bold', color: colors.navy }]}>{label}</Text>
      <Text style={[styles.priceValue, bold && { fontFamily: 'Nunito-Bold' }, primary && { color: colors.primary, fontSize: fontSize.h3 }, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  )
}

function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.gray} />
    </TouchableOpacity>
  )
}

function FailurePoint({ text }: { text: string }) {
  return (
    <View style={styles.failurePoint}>
      <View style={styles.failurePointDot} />
      <Text style={styles.failurePointText}>{text}</Text>
    </View>
  )
}

function formatCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  supportingText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: -spacing.xs },

  // Booking summary
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryLabel: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  summaryValue: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },

  // Promo
  promoHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promoRow: { flexDirection: 'row', gap: spacing.sm },
  promoInput: {
    flex: 1, height: 48,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy,
    backgroundColor: colors.lightGray,
  },
  applyBtn: {
    height: 48, paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.mint,
    borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnDisabled: { backgroundColor: colors.lightGray, borderColor: colors.border },
  applyBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.mint, borderRadius: radius.button, padding: spacing.md,
  },
  couponAppliedText: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  couponError: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.coral },

  // Payment method
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  methodRowActive: { borderColor: colors.primary, backgroundColor: colors.white },
  methodIcon: {
    width: 40, height: 40, borderRadius: radius.button,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  methodIconActive: { backgroundColor: colors.primary },
  methodLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  methodSub: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  walletHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: radius.button,
    padding: spacing.md,
  },
  walletHintText: { flex: 1, fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.primary },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  priceValue: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  divider: { height: 1, backgroundColor: colors.border },

  // Trust
  trustLine: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },
  trustText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },

  // Sticky bottom
  stickyBottom: {
    backgroundColor: '#F6F4EF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  secondaryCtaBtn: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  secondaryCtaText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
  ctaBtn: {
    height: 54, backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  ctaBtnText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },

  // Success
  successScroll: { alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.xl, gap: spacing.lg },
  successIconWrap: { marginBottom: spacing.sm },
  successIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy, textAlign: 'center' },
  successCopy: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginTop: -spacing.sm,
  },
  successSubtitle: {
    fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray,
    textAlign: 'center', lineHeight: 24, marginTop: -spacing.sm,
  },
  receiptCard: {
    width: '100%', backgroundColor: colors.white,
    borderRadius: radius.card, padding: spacing.md,
    gap: spacing.md, ...shadows.card,
  },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  receiptThumb: { width: 56, height: 56, borderRadius: radius.button },
  receiptTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  receiptTeacher: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  receiptDivider: { height: 1, backgroundColor: colors.border },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  receiptValue: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  successActionCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  failureCard: {
    backgroundColor: '#FFF4DF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F5D08A',
  },
  failureTitle: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.coral },
  failureText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy, lineHeight: 22 },
  failureHint: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 21 },
  failureList: { gap: spacing.sm, marginTop: spacing.xs },
  failurePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  failurePointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    marginTop: 7,
  },
  failurePointText: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 21 },
})
