import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, LoadingState } from '../../../../src/components/StateViews'
import { useTeacherSession, useUpdateBookingStatus } from '../../../../src/hooks/useTeacherSessions'
import { colors, fontSize, fontWeight, radius, spacing } from '../../../../src/constants/theme'

const SKILLS = ['Color mixing', 'Fine motor skills', 'Creative expression', 'Focus & concentration', 'Storytelling through art']
const ENGAGEMENT_LEVELS = ['High', 'Medium', 'Low'] as const
type Engagement = typeof ENGAGEMENT_LEVELS[number]

export default function CompleteSessionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { data: session, isLoading } = useTeacherSession(bookingId)
  const updateStatus = useUpdateBookingStatus()

  const [rating, setRating] = React.useState(0)
  const [engagement, setEngagement] = React.useState<Engagement | null>(null)
  const [notes, setNotes] = React.useState('')
  const [checkedSkills, setCheckedSkills] = React.useState<string[]>([])
  const [recommend, setRecommend] = React.useState<'yes' | 'no' | null>(null)

  const toggleSkill = (skill: string) => {
    setCheckedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])
  }

  const canSubmit = rating > 0 && notes.trim().length > 0 && !updateStatus.isPending

  const handleSubmit = async () => {
    if (!canSubmit || !bookingId) return
    await updateStatus.mutateAsync({ bookingId, status: 'completed' })
    router.replace('/(root)/sessions')
  }

  if (isLoading) return <LoadingState message="Loading session" />
  if (!session) return <EmptyState message="Session not found" />

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Session summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>{session?.activityTitle}</Text>
            <Text style={styles.summaryMeta}>{session?.childName} · {session?.timeRange}</Text>
            <Text style={styles.summaryMeta}>{session?.location}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Rating</Text>
          <Text style={styles.cardSub}>How did this session go overall?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? colors.yellow : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Engagement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Child Engagement</Text>
          <View style={styles.chipRow}>
            {ENGAGEMENT_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setEngagement(level)}
                style={[styles.engagementChip, engagement === level && styles.engagementChipActive]}
              >
                <Text style={[styles.engagementLabel, engagement === level && styles.engagementLabelActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes (required) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Notes <Text style={styles.required}>*</Text></Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setNotes}
            placeholder="What did you cover? How did the child respond? Any highlights or challenges…"
            placeholderTextColor={colors.gray}
            style={styles.notesInput}
            value={notes}
            textAlignVertical="top"
          />
          {notes.length === 0 && <Text style={styles.fieldHint}>Required before submitting</Text>}
        </View>

        {/* Skills checklist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills Practised</Text>
          {SKILLS.map((skill) => {
            const checked = checkedSkills.includes(skill)
            return (
              <TouchableOpacity key={skill} style={styles.skillRow} onPress={() => toggleSkill(skill)}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Ionicons name="checkmark" size={12} color={colors.white} />}
                </View>
                <Text style={styles.skillLabel}>{skill}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Recommend next */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommend a follow-up session?</Text>
          <View style={styles.chipRow}>
            {(['yes', 'no'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setRecommend(opt)}
                style={[styles.engagementChip, recommend === opt && styles.engagementChipActive]}
              >
                <Text style={[styles.engagementLabel, recommend === opt && styles.engagementLabelActive]}>
                  {opt === 'yes' ? 'Yes' : 'Not yet'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.submitBtnText}>{updateStatus.isPending ? 'Submitting…' : 'Submit Summary'}</Text>
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
  headerSpacer: { width: 36 },
  summaryCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    backgroundColor: colors.successBg, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.success, padding: spacing.md,
  },
  summaryIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.statusConfirmedBg, alignItems: 'center', justifyContent: 'center',
  },
  summaryInfo: { flex: 1, gap: 2 },
  summaryTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  summaryMeta: { color: colors.gray, fontSize: fontSize.caption },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, gap: spacing.sm,
  },
  cardTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  cardSub: { color: colors.gray, fontSize: fontSize.caption },
  starsRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  engagementChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.button, borderWidth: 1, borderColor: colors.border,
  },
  engagementChipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  engagementLabel: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  engagementLabelActive: { color: colors.primary },
  notesInput: {
    minHeight: 100, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, padding: spacing.md,
    color: colors.navy, fontSize: fontSize.body,
    backgroundColor: colors.lightGray,
  },
  fieldHint: { color: colors.error, fontSize: fontSize.caption },
  required: { color: colors.error },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  skillLabel: { color: colors.navy, fontSize: fontSize.body, flex: 1 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 14, marginTop: spacing.sm,
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
})
