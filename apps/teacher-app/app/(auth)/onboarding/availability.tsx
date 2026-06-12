import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { Screen } from '../../../src/components/Screen'
import { supabase } from '../../../src/lib/supabase'
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/constants/theme'

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={pb.track}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < step
        const isCurrent = i === step - 1
        return (
          <View
            key={i}
            style={[
              pb.segment,
              active ? pb.active : pb.inactive,
              isCurrent && pb.current,
            ]}
          />
        )
      })}
    </View>
  )
}

const pb = StyleSheet.create({
  track: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  segment: { height: 6, borderRadius: 3, flex: 1 },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: colors.border },
  current: { flex: 1.5, backgroundColor: colors.primary },
})

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const SLOTS = [
  { key: 'morning',   label: 'Morning',   sub: '9 AM – 12 PM', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Afternoon', sub: '12 – 5 PM',    icon: 'partly-sunny-outline' },
  { key: 'evening',   label: 'Evening',   sub: '5 – 9 PM',     icon: 'moon-outline' },
] as const

type SlotKey = 'morning' | 'afternoon' | 'evening'
type Availability = Partial<Record<typeof DAYS[number], SlotKey[]>>

export default function OnboardingAvailabilityScreen() {
  const [selectedDay, setSelectedDay] = React.useState<typeof DAYS[number]>('Mon')
  const [availability, setAvailability] = React.useState<Availability>({})
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const toggle = (day: typeof DAYS[number], slot: SlotKey) => {
    setAvailability((prev) => {
      const current = prev[day] ?? []
      const updated = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot]
      return { ...prev, [day]: updated }
    })
  }

  const copyToAllDays = () => {
    const activeSlots = availability[selectedDay] ?? []
    const updated: Availability = {}
    for (const d of DAYS) {
      updated[d] = [...activeSlots]
    }
    setAvailability(updated)
  }

  const copyToWeekdays = () => {
    const activeSlots = availability[selectedDay] ?? []
    const updated: Availability = { ...availability }
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
    for (const d of weekdays) {
      updated[d] = [...activeSlots]
    }
    setAvailability(updated)
  }

  const hasAny = Object.values(availability).some((slots) => (slots?.length ?? 0) > 0)

  const handleComplete = async () => {
    if (!hasAny) {
      setError('Please select at least one available time slot.')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      data: { availability, onboarding_complete: true },
    })

    setLoading(false)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      return
    }

    router.replace('/(root)')
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <ProgressBar step={3} total={3} />

      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>Your availability</Text>
        <Text style={styles.subtitle}>Select when you're generally available each week.</Text>
      </View>

      {/* Horizontal Day Selector */}
      <View style={styles.daysStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysStrip}>
          {DAYS.map((day) => {
            const active = selectedDay === day
            const hasSlots = (availability[day] ?? []).length > 0
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={({ pressed }) => [
                  styles.dayButton,
                  active ? styles.dayButtonActive : styles.dayButtonInactive,
                  pressed && styles.dayButtonPressed,
                ]}
              >
                <Text style={[styles.dayText, active ? styles.dayTextActive : styles.dayTextInactive]}>
                  {day}
                </Text>
                {hasSlots && <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Details Card for Selected Day */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedDay}'s Availability</Text>
          <Text style={styles.detailSubtitle}>Choose slots for this day</Text>
        </View>

        <View style={styles.slotsList}>
          {SLOTS.map((slot) => {
            const isSelected = (availability[selectedDay] ?? []).includes(slot.key as SlotKey)
            return (
              <Pressable
                key={slot.key}
                onPress={() => toggle(selectedDay, slot.key as SlotKey)}
                style={({ pressed }) => [
                  styles.slotRow,
                  isSelected ? styles.slotRowSelected : styles.slotRowUnselected,
                  pressed && styles.slotRowPressed,
                ]}
              >
                <View style={styles.slotLeft}>
                  <View style={[styles.iconBg, isSelected ? styles.iconBgSelected : styles.iconBgUnselected]}>
                    <Ionicons
                      name={slot.icon}
                      size={20}
                      color={isSelected ? colors.white : colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.slotLabel, isSelected && styles.slotLabelActive]}>{slot.label}</Text>
                    <Text style={[styles.slotSub, isSelected && styles.slotSubActive]}>{slot.sub}</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxUnselected]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color={colors.white} />}
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Copy Tools */}
        <View style={styles.tools}>
          <Pressable style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]} onPress={copyToWeekdays}>
            <Ionicons name="copy-outline" size={16} color={colors.primary} />
            <Text style={styles.toolBtnText}>Apply to Weekdays (Mon-Fri)</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]} onPress={copyToAllDays}>
            <Ionicons name="duplicate-outline" size={16} color={colors.primary} />
            <Text style={styles.toolBtnText}>Apply to All Days</Text>
          </Pressable>
        </View>
      </View>

      {!!error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <View style={styles.cta}>
        <Button
          label={loading ? 'Saving…' : 'Complete Setup'}
          onPress={handleComplete}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    backgroundColor: '#F8FBFD',
  },
  header: { gap: 4 },
  step: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  title: { color: colors.navy, fontSize: fontSize.h1, fontWeight: fontWeight.bold },
  subtitle: { color: colors.gray, fontSize: fontSize.bodyLg, lineHeight: 22 },

  daysStripContainer: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  daysStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dayButton: {
    width: 48,
    height: 52,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: colors.white,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dayButtonInactive: {
    borderColor: colors.border,
  },
  dayButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  dayText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  dayTextActive: {
    color: colors.white,
  },
  dayTextInactive: {
    color: colors.navy,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 6,
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  dotInactive: {
    backgroundColor: colors.primary,
  },

  detailCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: spacing.md,
  },
  detailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  detailTitle: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  detailSubtitle: {
    fontSize: fontSize.caption,
    color: colors.gray,
    marginTop: 2,
  },
  slotsList: {
    gap: spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
  },
  slotRowSelected: {
    backgroundColor: '#E5F7F4',
    borderColor: colors.primary,
  },
  slotRowUnselected: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  slotRowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgSelected: {
    backgroundColor: colors.primary,
  },
  iconBgUnselected: {
    backgroundColor: '#F1F5F9',
  },
  slotLabel: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  slotLabelActive: {
    color: colors.primary,
  },
  slotSub: {
    fontSize: fontSize.caption,
    color: colors.gray,
    marginTop: 2,
  },
  slotSubActive: {
    color: colors.primary,
    opacity: 0.8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxUnselected: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  tools: {
    flexDirection: 'column',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.input,
  },
  toolBtnPressed: {
    backgroundColor: colors.lightGray,
  },
  toolBtnText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.input,
  },
  error: { color: colors.error, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  cta: { paddingBottom: spacing.xl },
})

