import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'
import type { Slot } from '@/lib/api'

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface SlotGridProps {
  slots: Slot[]
  selectedSlotId: string | null
  loading: boolean
  onSelect: (id: string) => void
}

export function SlotGrid({ slots, selectedSlotId, loading, onSelect }: SlotGridProps) {
  if (loading) {
    return (
      <View style={[styles.slotGrid, { gap: spacing.sm }]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={100} height={40} radius={radius.button} />
        ))}
      </View>
    )
  }

  if (slots.length === 0) {
    return (
      <View style={styles.noSlots}>
        <Ionicons name="calendar-outline" size={32} color={colors.border} />
        <Text style={styles.noSlotsText}>No slots available on this day</Text>
      </View>
    )
  }

  return (
    <View style={styles.slotGrid}>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id
        return (
          <TouchableOpacity
            key={slot.id}
            style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
            onPress={() => onSelect(slot.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={14} color={isSelected ? colors.white : colors.primary} />
            <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
              {formatTime(slot.startTime)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  slotBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  slotTextSelected: { color: colors.white },
  noSlots: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  noSlotsText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
})
