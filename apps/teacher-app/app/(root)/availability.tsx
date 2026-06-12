import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAvailability, useUpdateAvailability } from '../../src/hooks/useAvailability'
import { colors, fontSize, fontWeight, heroOverlay, radius, spacing } from '../../src/constants/theme'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = [
  { key: 'morning',   label: 'Morning',   sub: '9 AM – 12 PM' },
  { key: 'afternoon', label: 'Afternoon', sub: '12 – 5 PM' },
  { key: 'evening',   label: 'Evening',   sub: '5 – 9 PM' },
]

type SlotKey = 'morning' | 'afternoon' | 'evening'
type Availability = Partial<Record<string, SlotKey[]>>

export default function AvailabilityScreen() {
  const { data: remoteAvailability } = useAvailability()
  const updateAvailability = useUpdateAvailability()

  const [availability, setAvailability] = React.useState<Availability>({})
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (remoteAvailability) {
      setAvailability(remoteAvailability as Availability)
    }
  }, [remoteAvailability])

  const toggle = (day: string, slot: SlotKey) => {
    setSaved(false)
    setAvailability((prev) => {
      const current = (prev[day] ?? []) as SlotKey[]
      const updated = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot]
      return { ...prev, [day]: updated }
    })
  }

  const hasAny = Object.values(availability).some((slots) => (slots?.length ?? 0) > 0)

  const handleSave = async () => {
    try {
      await updateAvailability.mutateAsync(availability as Record<string, string[]>)
      setSaved(true)
    } catch {
      // error state handled via updateAvailability.isError
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Select when you're generally available each week. Parents will only see sessions in these windows.
        </Text>

        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>Availability updated</Text>
          </View>
        )}

        <View style={styles.grid}>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.slotRow}>
                {SLOTS.map((slot) => {
                  const active = (availability[day] ?? []).includes(slot.key as SlotKey)
                  return (
                    <TouchableOpacity
                      key={slot.key}
                      onPress={() => toggle(day, slot.key as SlotKey)}
                      style={[styles.slotChip, active ? styles.slotActive : styles.slotInactive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.slotLabel, active ? styles.slotLabelActive : styles.slotLabelInactive]}>
                        {slot.label}
                      </Text>
                      <Text style={[styles.slotSub, active ? styles.slotSubActive : styles.slotSubInactive]}>
                        {slot.sub}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        {updateAvailability.isError && (
          <Text style={styles.errorText}>Failed to save. Please try again.</Text>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, (!hasAny || updateAvailability.isPending) && styles.saveBtnDisabled]}
          disabled={!hasAny || updateAvailability.isPending}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>{updateAvailability.isPending ? 'Saving…' : 'Save Availability'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  subtitle: { color: colors.gray, fontSize: fontSize.body, lineHeight: 22 },
  headerSpacer: { width: 36 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.successBg, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.success, padding: spacing.md,
  },
  successText: { color: colors.success, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  grid: { gap: spacing.md },
  dayRow: { gap: spacing.sm },
  dayLabel: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  slotRow: { flexDirection: 'row', gap: spacing.sm },
  slotChip: {
    flex: 1, padding: spacing.sm,
    borderRadius: radius.button, borderWidth: 1, alignItems: 'center',
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotInactive: { backgroundColor: colors.white, borderColor: colors.border },
  slotLabel: { fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  slotLabelActive: { color: colors.white },
  slotLabelInactive: { color: colors.navy },
  slotSub: { fontSize: 10 },
  slotSubActive: { color: heroOverlay.slotSub },
  slotSubInactive: { color: colors.gray },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 14,
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  errorText: { color: colors.error, fontSize: fontSize.caption, textAlign: 'center' },
})
