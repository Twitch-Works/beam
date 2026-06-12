import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, spacing, radius, fontSize } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'

interface DateItem {
  iso: string
  day: string
  date: number
  hasSlots: boolean
}

interface DateStripProps {
  dateList: DateItem[]
  activeDate: string
  loading: boolean
  onSelect: (iso: string) => void
}

export function DateStrip({ dateList, activeDate, loading, onSelect }: DateStripProps) {
  if (loading) {
    return (
      <View style={styles.dayStrip}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} width={52} height={68} radius={radius.button} />
        ))}
      </View>
    )
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
      {dateList.map((d, i) => {
        const isSelected = activeDate === d.iso
        return (
          <TouchableOpacity
            key={d.iso}
            style={[styles.dayBtn, isSelected && styles.dayBtnSelected, !d.hasSlots && styles.dayBtnDisabled]}
            onPress={() => d.hasSlots && onSelect(d.iso)}
            disabled={!d.hasSlots}
            activeOpacity={0.8}
          >
            <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected, !d.hasSlots && styles.dayLabelDisabled]}>
              {d.day}
            </Text>
            <Text style={[styles.dateLabel, isSelected && styles.dateLabelSelected, !d.hasSlots && styles.dayLabelDisabled]}>
              {d.date}
            </Text>
            {i === 0 && !isSelected && <View style={styles.todayDot} />}
            {!d.hasSlots && <Text style={styles.noSlotLabel}>Full</Text>}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  dayStrip: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  dayBtn: {
    width: 52,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  dayBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayBtnDisabled: { opacity: 0.4 },
  dayLabel: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  dayLabelSelected: { color: colors.white },
  dayLabelDisabled: { color: colors.border },
  dateLabel: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  dateLabelSelected: { color: colors.white },
  todayDot: { width: 5, height: 5, borderRadius: radius.avatar, backgroundColor: colors.primary },
  noSlotLabel: { fontSize: fontSize.micro, fontFamily: 'Nunito-Regular', color: colors.gray },
})
