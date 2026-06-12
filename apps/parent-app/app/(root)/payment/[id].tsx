import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
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
import { parentApi } from '@/lib/api'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'

// react-native-razorpay requires a native build — not available in Expo Go
let RazorpayCheckout: any = null
try { RazorpayCheckout = require('react-native-razorpay').default } catch (_) {}

type PaymentMethod = 'upi' | 'card'

function formatDisplayDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function shortId(): string {
  return 'BM' + Math.floor(10000 + Math.random() * 90000)
}

export default function PaymentScreen() {
  const insets = useSafeAreaInsets()
  const { id, slotId, date, time, price: priceParam } =
    useLocalSearchParams<{ id: string; slotId: string; date: string; time: string; price: string }>()

  const { user } = useAuth()
  const { data: activityData } = useActivity(id ?? null)
  const { data: childrenData } = useChildren()
  const firstChild = childrenData?.items[0] ?? null

  const sessionPrice  = priceParam ? parseFloat(priceParam) : (activityData ? parseFloat(activityData.pricePerSession) : 0)
  const activity      = activityData
  const activityTitle = activity?.title ?? '—'

  const [method, setMethod]           = useState<PaymentMethod>('upi')
  const [couponCode, setCouponCode]   = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount]       = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingId, setBookingId]     = useState<string | null>(null)

  const total = sessionPrice - discount

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
    if (isProcessing || !user || !id) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsProcessing(true)
    try {
      if (!firstChild?.id) { Alert.alert('No child profile', 'Add a child from the Kids tab first.'); return }
      if (!slotId) { Alert.alert('Missing slot', 'Go back and select a slot.'); return }

      const { booking } = await parentApi.bookings.create({
        parentId: user.id, childId: firstChild.id,
        activityId: id, slotId,
        totalAmount: total,
        discountCode: couponApplied ? couponCode : undefined,
        discountAmount: discount,
      })

      const { orderId, amount: orderAmount, currency, keyId } =
        await parentApi.payments.createOrder(booking.id)

      if (!RazorpayCheckout) {
        Alert.alert('Native build required', 'Razorpay is not available in Expo Go. Use a development build to test payments.')
        return
      }

      const data = await RazorpayCheckout.open({
        description: activityTitle, currency,
        key: keyId, amount: String(orderAmount), name: 'Beam',
        order_id: orderId,
        prefill: { contact: user.phone ?? '', name: (user.user_metadata?.firstName as string) ?? '' },
        theme: { color: '#1787A6' },
      })

      await parentApi.payments.verifyPayment(booking.id, {
        razorpayPaymentId: data.razorpay_payment_id,
        razorpayOrderId:   data.razorpay_order_id,
        razorpaySignature: data.razorpay_signature,
      })

      setBookingId(booking.id)
    } catch (err: any) {
      if (err?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment failed', err?.description ?? err?.message ?? 'Something went wrong.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Success screen ──
  if (bookingId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <BookingWizardHeader step={4} totalSteps={3} onBack={() => {}} />
        <ScrollView contentContainerStyle={[styles.successScroll, { paddingBottom: insets.bottom + 100 }]}>
          {/* Check icon */}
          <View style={styles.successIconWrap}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your session has been booked. You'll receive a confirmation shortly.
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
                <Text style={styles.receiptTeacher}>with {firstChild?.firstName ?? 'your child'}</Text>
              </View>
            </View>
            <View style={styles.receiptDivider} />
            {[
              { label: 'Date & Time', value: `${date ? formatDisplayDate(date) : '—'}, ${time ?? '—'}` },
              { label: 'Location',    value: 'Your Home · ' + ((user?.user_metadata?.city as string) ?? '') },
              { label: 'Amount Paid', value: `₹${total}` },
              { label: 'Booking ID',  value: shortId() },
            ].map(row => (
              <View key={row.label} style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>{row.label}</Text>
                <Text style={styles.receiptValue}>{row.value}</Text>
              </View>
            ))}
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

  // ── Step 3: Review & Pay ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader step={3} totalSteps={3} onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Activity bar */}
        <ActivitySummaryBar
          title={activityTitle}
          durationMins={activity?.sessionDurationMins}
          sessionType={activity?.sessionType}
          price={sessionPrice}
          imageUrl={activity?.imageUrl}
        />

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          {[
            { icon: 'calendar-outline',  label: 'Date',  value: date ? formatDisplayDate(date) + ' ' + new Date().getFullYear() : '—' },
            { icon: 'time-outline',      label: 'Time',  value: time ?? '—' },
            { icon: 'home-outline',      label: 'Mode',  value: activity?.sessionType === 'home' ? 'At Home' : 'Online' },
            { icon: 'person-outline',    label: 'Child', value: firstChild ? `${firstChild.firstName} (${getAge(firstChild.dateOfBirth)} yrs)` : '—' },
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
            <Text style={styles.cardTitle}>Promo Code</Text>
          </View>
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
          <Text style={styles.cardTitle}>Payment Method</Text>
          {([
            { id: 'upi',  label: 'UPI / GPay / PhonePe', sub: 'priya.sharma@okaxis', icon: 'phone-portrait-outline' },
            { id: 'card', label: 'Credit / Debit Card',  sub: '•••• •••• •••• 4242', icon: 'card-outline' },
          ] as const).map(m => {
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
          <Text style={styles.trustText}>100% secure payment · Free cancellation 4hrs before</Text>
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
          <Text style={styles.ctaBtnText}>{isProcessing ? 'Processing…' : `Pay ₹${total}`}</Text>
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
})
