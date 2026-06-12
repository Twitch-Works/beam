import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useSlots } from '@/hooks/useSlots'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'
import { MonthCalendar } from '@/components/booking/MonthCalendar'
import type { Slot } from '@/lib/api'

type WizardStep = 1 | 2 // 1 = Date, 2 = Time

function todayISO() { return new Date().toISOString().split('T')[0] }

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDisplayDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

type Period = 'MORNING' | 'AFTERNOON' | 'EVENING'

function getPeriod(startTime: string): Period {
  const h = parseInt(startTime.split(':')[0], 10)
  if (h < 12) return 'MORNING'
  if (h < 17) return 'AFTERNOON'
  return 'EVENING'
}

function groupSlots(slots: Slot[]): { period: Period; slots: Slot[] }[] {
  const map: Record<Period, Slot[]> = { MORNING: [], AFTERNOON: [], EVENING: [] }
  for (const s of slots) {
    if (s.isAvailable) map[getPeriod(s.startTime)].push(s)
  }
  return (['MORNING', 'AFTERNOON', 'EVENING'] as Period[])
    .filter(p => map[p].length > 0)
    .map(p => ({ period: p, slots: map[p] }))
}

export default function SlotPickerScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: activityData } = useActivity(id ?? null)
  const { data: slotsData, isLoading: loadingSlots } = useSlots(id ?? null, todayISO(), 30)

  const [step, setStep]               = useState<WizardStep>(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const slots: Slot[] = slotsData?.slots[selectedDate ?? ''] ?? []
  const groups = useMemo(() => groupSlots(slots), [slots])
  const selectedSlot = slots.find(s => s.id === selectedSlotId) ?? null

  const activity = activityData
  const price    = activity ? parseFloat(activity.pricePerSession) : 0

  function handleBack() {
    if (step === 2) { setStep(1); setSelectedSlotId(null) }
    else router.back()
  }

  async function handleChooseTime() {
    if (!selectedDate) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep(2)
  }

  async function handleSlotSelect(slotId: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedSlotId(prev => prev === slotId ? null : slotId)
  }

  async function handleContinue() {
    if (!selectedSlot || !selectedDate) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push({
      pathname: `/(root)/payment/${id}`,
      params: {
        slotId:   selectedSlot.id,
        date:     selectedDate,
        time:     formatTime(selectedSlot.startTime),
        duration: activity ? `${activity.sessionDurationMins}` : '',
        price:    activity?.pricePerSession ?? '0',
      },
    })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader step={step} totalSteps={3} onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Activity mini-card */}
        <ActivitySummaryBar
          title={activity?.title ?? '—'}
          teacherName={null}
          durationMins={activity?.sessionDurationMins}
          sessionType={activity?.sessionType}
          price={price}
          imageUrl={activity?.imageUrl}
        />

        {/* ── Step 1: Date ── */}
        {step === 1 && (
          <View style={styles.card}>
            <MonthCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </View>
        )}

        {/* ── Step 2: Time ── */}
        {step === 2 && (
          <View style={styles.card}>
            {/* Selected date heading */}
            <View style={styles.dateHeadingRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.gray} />
              <Text style={styles.dateHeadingText}>{selectedDate ? formatDisplayDate(selectedDate) : ''}</Text>
            </View>
            <Text style={styles.timeHeading}>Choose a time slot</Text>

            {loadingSlots ? (
              <Text style={styles.loadingText}>Loading slots…</Text>
            ) : groups.length === 0 ? (
              <Text style={styles.emptyText}>No slots available on this date.</Text>
            ) : (
              groups.map(({ period, slots: periodSlots }) => (
                <View key={period} style={styles.periodGroup}>
                  <Text style={styles.periodLabel}>{period}</Text>
                  <View style={styles.slotsRow}>
                    {periodSlots.map(slot => {
                      const active = selectedSlotId === slot.id
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[styles.slotChip, active && styles.slotChipActive]}
                          onPress={() => handleSlotSelect(slot.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={active ? colors.white : colors.gray}
                          />
                          <Text style={[styles.slotText, active && styles.slotTextActive]}>
                            {formatTime(slot.startTime)}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom CTA ── */}
      {step === 1 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, !selectedDate && styles.ctaBtnDisabled]}
            onPress={handleChooseTime}
            disabled={!selectedDate}
            activeOpacity={0.88}
          >
            <Text style={[styles.ctaBtnText, !selectedDate && styles.ctaBtnTextDisabled]}>Choose Time</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={[styles.bottomBarStack, { paddingBottom: insets.bottom + spacing.sm }]}>
          {selectedSlot && (
            <View style={styles.selectedPill}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.selectedPillText}>Selected: {formatTime(selectedSlot.startTime)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.ctaBtn, !selectedSlot && styles.ctaBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedSlot}
            activeOpacity={0.88}
          >
            <Text style={[styles.ctaBtnText, !selectedSlot && styles.ctaBtnTextDisabled]}>
              Continue to Payment
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
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

  // Step 2 — time
  dateHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateHeadingText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  timeHeading: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  loadingText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, textAlign: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, textAlign: 'center', paddingVertical: spacing.xl },

  periodGroup: { gap: spacing.sm },
  periodLabel: {
    fontSize: fontSize.caption, fontFamily: 'Nunito-Bold',
    color: colors.gray, letterSpacing: 0.8,
  },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radius.button,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  slotTextActive: { color: colors.white },

  // Bottom bars
  bottomBar: {
    backgroundColor: '#F6F4EF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  bottomBarStack: {
    backgroundColor: '#F6F4EF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  selectedPillText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  ctaBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  ctaBtnText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
  ctaBtnTextDisabled: { color: colors.gray },
})
