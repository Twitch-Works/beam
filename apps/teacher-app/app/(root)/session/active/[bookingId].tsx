import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, LoadingState } from '../../../../src/components/StateViews'
import { useTeacherSession } from '../../../../src/hooks/useTeacherSessions'
import { colors, fontSize, fontWeight, heroOverlay, radius, spacing } from '../../../../src/constants/theme'

const SKILLS = ['Color mixing', 'Fine motor', 'Creativity', 'Focus', 'Imagination', 'Expression', 'Storytelling']
const MOODS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'great', label: 'Great', icon: 'happy-outline' },
  { key: 'okay', label: 'Okay', icon: 'remove-circle-outline' },
  { key: 'tough', label: 'Tough', icon: 'sad-outline' },
]

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function ActiveSessionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { data: session, isLoading } = useTeacherSession(bookingId)

  const [seconds, setSeconds] = React.useState(0)
  const [running, setRunning] = React.useState(true)
  const [mood, setMood] = React.useState<string | null>(null)
  const [note, setNote] = React.useState('')
  const [skills, setSkills] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])
  }

  const handleSOS = () => {
    Alert.alert('SOS', 'What do you need help with?', [
      { text: 'Call Beam Support', onPress: () => Linking.openURL('tel:+918008001234') },
      { text: 'Cancel', style: 'cancel' },
    ])
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Session in Progress</Text>
          <Text style={styles.headerSub}>{session?.childName} · {session?.activityTitle}</Text>
        </View>
        <View style={styles.liveDot} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Timer */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Elapsed Time</Text>
          <Text style={styles.timer}>{fmt(seconds)}</Text>
          <TouchableOpacity
            style={[styles.timerToggle, running ? styles.timerPause : styles.timerResume]}
            onPress={() => setRunning((r) => !r)}
          >
            <Ionicons name={running ? 'pause' : 'play'} size={18} color={colors.white} />
            <Text style={styles.timerToggleText}>{running ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
        </View>

        {/* Mood check */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How is the session going?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMood(m.key)}
                style={[styles.moodBtn, mood === m.key && styles.moodBtnActive]}
              >
                <Ionicons name={m.icon} size={24} color={mood === m.key ? colors.primary : colors.gray} />
                <Text style={[styles.moodLabel, mood === m.key && styles.moodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Note</Text>
          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setNote}
            placeholder="Observations, highlights, anything to remember…"
            placeholderTextColor={colors.gray}
            style={styles.noteInput}
            value={note}
            textAlignVertical="top"
          />
        </View>

        {/* Skills observed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills Observed</Text>
          <Text style={styles.cardSub}>Tap to mark what you observed today</Text>
          <View style={styles.skillsRow}>
            {SKILLS.map((skill) => {
              const active = skills.includes(skill)
              return (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  style={[styles.skillChip, active && styles.skillChipActive]}
                >
                  <Text style={[styles.skillLabel, active && styles.skillLabelActive]}>{skill}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* End session */}
        <TouchableOpacity
          style={styles.endBtn}
          onPress={() => router.replace(`/(root)/session/complete/${bookingId}`)}
        >
          <Ionicons name="stop-circle" size={20} color={colors.white} />
          <Text style={styles.endBtnText}>End Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating SOS */}
      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
        <Ionicons name="warning" size={18} color={colors.white} />
        <Text style={styles.sosBtnText}>SOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  headerSub: { color: colors.gray, fontSize: fontSize.caption, marginTop: 2 },
  liveDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.coral,
    shadowColor: colors.coral, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4,
  },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  timerCard: {
    backgroundColor: colors.primary, borderRadius: radius.card,
    padding: spacing.lg, alignItems: 'center', gap: spacing.sm,
  },
  timerLabel: { color: heroOverlay.label, fontSize: fontSize.body },
  timer: { color: colors.white, fontSize: 52, fontWeight: fontWeight.bold, letterSpacing: 2 },
  timerToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.button,
    marginTop: spacing.xs,
  },
  timerPause: { backgroundColor: heroOverlay.timerPause },
  timerResume: { backgroundColor: heroOverlay.timerResume },
  timerToggleText: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, gap: spacing.sm,
  },
  cardTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  cardSub: { color: colors.gray, fontSize: fontSize.caption },
  moodRow: { flexDirection: 'row', gap: spacing.sm },
  moodBtn: {
    flex: 1, alignItems: 'center', gap: 6, padding: spacing.sm,
    borderRadius: radius.button, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  moodBtnActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  moodLabel: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  moodLabelActive: { color: colors.primary },
  noteInput: {
    minHeight: 80, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, padding: spacing.md,
    color: colors.navy, fontSize: fontSize.body,
    backgroundColor: colors.lightGray,
  },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  skillChipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  skillLabel: { color: colors.navy, fontSize: fontSize.caption },
  skillLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.coral,
    borderRadius: radius.button, paddingVertical: 14, marginTop: spacing.sm,
  },
  endBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  sosBtn: {
    position: 'absolute', bottom: 90, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: 999,
    shadowColor: colors.coral, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  sosBtnText: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold },
})
