import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import {
  MAIN_BOOKING_STEP_LABELS,
  buildBookingCta,
  getBookingTypeLabel,
  getBookingTypeOptions,
  type BookingType,
} from '@/lib/booking-flow'

export default function ChooseBookingTypeScreen() {
  const insets = useSafeAreaInsets()
  const { id, teacherId, teacherName } = useLocalSearchParams<{
    id: string
    teacherId?: string
    teacherName?: string
  }>()
  const { data: activity } = useActivity(id ?? null)
  const [selectedType, setSelectedType] = useState<BookingType | null>(null)

  const basePrice = activity ? parseFloat(activity.pricePerSession) : 0
  const options = useMemo(() => getBookingTypeOptions(activity), [activity])
  const activeType = selectedType ?? (options.find((option) => option.enabled)?.id ?? null)
  const ctaLabel = buildBookingCta(activeType, basePrice || 0)

  async function handleContinue() {
    if (!id || !activeType) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push({
      pathname: '/(root)/slots/[id]',
      params: {
        id,
        flowId: String(Date.now()),
        teacherId: teacherId ?? '',
        teacherName: teacherName ?? '',
        bookingType: activeType,
        bookingTypeLabel: getBookingTypeLabel(activeType),
      },
    })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader
        step={1}
        totalSteps={MAIN_BOOKING_STEP_LABELS.length}
        stepLabels={MAIN_BOOKING_STEP_LABELS}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <ActivitySummaryBar
          title={activity?.title ?? '—'}
          teacherName={teacherName ?? null}
          durationMins={activity?.sessionDurationMins}
          deliveryMode={activity?.deliveryMode}
          price={basePrice}
          imageUrl={activity?.imageUrl}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose booking type</Text>
          <Text style={styles.cardSubtext}>
            Keep the path short for first-time parents. Start with the booking style that best matches your decision stage.
          </Text>

          {options.map((option) => {
            const active = option.id === activeType
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  active && styles.optionCardActive,
                  !option.enabled && styles.optionCardDisabled,
                ]}
                onPress={async () => {
                  if (!option.enabled) return
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSelectedType(option.id)
                }}
                activeOpacity={option.enabled ? 0.85 : 1}
              >
                <View style={styles.optionMain}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.optionTitle, !option.enabled && styles.optionTitleDisabled]}>
                      {option.label}
                    </Text>
                    {option.badge ? (
                      <View style={[styles.badge, !option.enabled && styles.badgeMuted]}>
                        <Text style={[styles.badgeText, !option.enabled && styles.badgeTextMuted]}>
                          {option.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.optionDescription, !option.enabled && styles.optionDescriptionDisabled]}>
                    {option.description}
                  </Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive, !option.enabled && styles.radioDisabled]}>
                  {active && option.enabled ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, !activeType && styles.ctaBtnDisabled]}
          onPress={handleContinue}
          disabled={!activeType}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  cardSubtext: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 21 },
  optionCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  optionCardDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.border,
  },
  optionMain: { flex: 1, gap: spacing.xs },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  optionTitle: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  optionTitleDisabled: { color: colors.gray },
  optionDescription: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 20 },
  optionDescriptionDisabled: { color: colors.gray },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeMuted: { backgroundColor: colors.border },
  badgeText: { fontSize: fontSize.micro, fontFamily: 'Nunito-Bold', color: colors.white },
  badgeTextMuted: { color: colors.gray },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDisabled: { opacity: 0.6 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
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
  ctaBtnDisabled: { opacity: 0.5 },
  ctaText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
})
