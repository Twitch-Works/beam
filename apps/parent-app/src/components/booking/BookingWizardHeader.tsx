import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

interface BookingWizardHeaderProps {
  step: number
  totalSteps: number
  onBack: () => void
}

const STEP_LABELS = ['Date', 'Time', 'Payment']

export function BookingWizardHeader({ step, totalSteps, onBack }: BookingWizardHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Book Session</Text>
          <Text style={styles.stepText}>Step {step} of {totalSteps}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step

          return (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  active && styles.stepDotActive,
                ]}>
                  {done ? (
                    <Ionicons name="checkmark" size={13} color={colors.white} />
                  ) : (
                    <Text style={[styles.stepNum, active && styles.stepNumActive]}>{n}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View style={[styles.stepLine, i < step - 1 && styles.stepLineDone]} />
              )}
            </React.Fragment>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  stepText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  stepItem: { alignItems: 'center', gap: spacing.xs },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.lightGray,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNum: { fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.gray },
  stepNumActive: { color: colors.white },
  stepLabel: { fontSize: fontSize.micro, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  stepLabelActive: { color: colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: spacing.lg },
  stepLineDone: { backgroundColor: colors.primary },
})
