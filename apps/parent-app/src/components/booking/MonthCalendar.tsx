import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

const { width } = Dimensions.get('window')
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface MonthCalendarProps {
  selectedDate: string | null      // ISO yyyy-mm-dd
  onSelectDate: (iso: string) => void
  minDate?: string                 // ISO, defaults to today
  enabledDates?: string[]          // if provided, only these dates are selectable
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function MonthCalendar({ selectedDate, onSelectDate, minDate, enabledDates }: MonthCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())
  const floor = minDate ?? todayISO
  const enabledDateSet = enabledDates ? new Set(enabledDates) : null

  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build 6×7 grid (some cells null = empty)
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth()

  function prevMonth() {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={!canGoPrev}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-back" size={18} color={canGoPrev ? colors.navy : colors.border} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.navy} />
        </TouchableOpacity>
      </View>

      {/* Day name headers */}
      <View style={styles.dayRow}>
        {DAY_LABELS.map(d => (
          <Text key={d} style={styles.dayName}>{d}</Text>
        ))}
      </View>

      {/* Date grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />
          const iso = toISO(viewYear, viewMonth, day)
          const isPast = iso < floor
          const isEnabled = enabledDateSet ? enabledDateSet.has(iso) : !isPast
          const isDisabled = isPast || !isEnabled
          const isSelected = iso === selectedDate
          const isToday = iso === todayISO

          return (
            <TouchableOpacity
              key={iso}
              style={styles.cell}
              onPress={() => !isDisabled && onSelectDate(iso)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dateBubble,
                isSelected && styles.dateBubbleSelected,
                isToday && !isSelected && styles.dateBubbleToday,
              ]}>
                <Text style={[
                  styles.dateText,
                  isDisabled && styles.dateTextPast,
                  isSelected && styles.dateTextSelected,
                  isToday && !isSelected && styles.dateTextToday,
                ]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const CELL_SIZE = Math.floor((width - spacing.md * 2 - spacing.md * 2) / 7)

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  monthLabel: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },

  dayRow: { flexDirection: 'row' },
  dayName: {
    flex: 1, textAlign: 'center',
    fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBubble: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dateBubbleSelected: { backgroundColor: colors.primary },
  dateBubbleToday: { backgroundColor: colors.mint },
  dateText: {
    fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy,
  },
  dateTextPast: { color: colors.border },
  dateTextSelected: { color: colors.white, fontFamily: 'Nunito-Bold' },
  dateTextToday: { color: colors.primary, fontFamily: 'Nunito-Bold' },
})
