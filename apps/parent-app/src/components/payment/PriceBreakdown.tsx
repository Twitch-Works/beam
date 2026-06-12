import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

interface PriceBreakdownProps {
  sessionPrice: number
  discount: number
  platformFee: number
  total: number
  couponCode: string
  couponApplied: boolean
  couponError: string
  onCouponChange: (text: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
}

export function PriceBreakdown({
  sessionPrice, discount, platformFee, total,
  couponCode, couponApplied, couponError,
  onCouponChange, onApplyCoupon, onRemoveCoupon,
}: PriceBreakdownProps) {
  return (
    <>
      {/* Coupon */}
      <View style={styles.section}>
        <Text style={styles.label}>Coupon Code</Text>
        {couponApplied ? (
          <View style={styles.couponApplied}>
            <Ionicons name="pricetag" size={18} color={colors.success} />
            <Text style={styles.couponAppliedText}>BEAM10 applied — ₹{discount} off!</Text>
            <TouchableOpacity onPress={onRemoveCoupon}>
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              value={couponCode}
              onChangeText={onCouponChange}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.gray}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, !couponCode && styles.applyBtnDisabled]}
              onPress={onApplyCoupon}
              disabled={!couponCode}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
      </View>

      {/* Price rows */}
      <View style={styles.section}>
        <Text style={styles.label}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Session fee</Text>
          <Text style={styles.priceValue}>₹{sessionPrice.toFixed(0)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.success }]}>Coupon discount</Text>
            <Text style={[styles.priceValue, { color: colors.success }]}>−₹{discount}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Platform fee</Text>
          <Text style={styles.priceValue}>₹{platformFee}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  couponRow: { flexDirection: 'row', gap: spacing.sm },
  couponInput: {
    flex: 1, height: 48, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: spacing.md,
    fontSize: fontSize.bodyLg, fontFamily: 'Nunito-SemiBold',
    color: colors.navy, backgroundColor: colors.lightGray,
  },
  applyBtn: { height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.input, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyBtnDisabled: { backgroundColor: colors.border },
  applyBtnText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.statusConfirmedBg, borderRadius: radius.input, padding: spacing.md,
  },
  couponAppliedText: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.statusConfirmedText },
  couponError: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.error, marginTop: -spacing.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  priceValue: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  totalLabel: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  totalValue: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.primary },
})
