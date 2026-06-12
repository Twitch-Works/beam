import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI',         icon: 'phone-portrait-outline', subtitle: 'GPay, PhonePe, Paytm' },
  { id: 'card',       label: 'Card',        icon: 'card-outline',           subtitle: 'Credit / Debit card' },
  { id: 'netbanking', label: 'Net Banking', icon: 'business-outline',       subtitle: 'All major banks' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id']

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onSelect: (id: PaymentMethod) => void
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <View style={styles.container}>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selected === method.id
        return (
          <TouchableOpacity
            key={method.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onSelect(method.id)
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.icon, isSelected && styles.iconSelected]}>
              <Ionicons name={method.icon as any} size={20} color={isSelected ? colors.white : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{method.label}</Text>
              <Text style={styles.subtitle}>{method.subtitle}</Text>
            </View>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.card, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.lightGray,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.mint },
  icon: {
    width: 44, height: 44, borderRadius: radius.button,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  labelSelected: { color: colors.primary },
  subtitle: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: radius.avatar, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: radius.avatar, backgroundColor: colors.primary },
})
