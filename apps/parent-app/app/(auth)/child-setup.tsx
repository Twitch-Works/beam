import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

type Step = 'info' | 'interests' | 'photo' | 'success'

const AGE_OPTIONS = [
  { label: 'Under 1', mid: 0 },
  { label: '1–2 yrs', mid: 1 },
  { label: '2–3 yrs', mid: 2 },
  { label: '3–4 yrs', mid: 3 },
  { label: '4–6 yrs', mid: 5 },
  { label: '6–8 yrs', mid: 7 },
  { label: '8–10 yrs', mid: 9 },
  { label: '10+ yrs', mid: 11 },
]

const GENDER_OPTIONS = ['Boy', 'Girl', 'Non-binary', 'Prefer not to say']

const INTERESTS = [
  { id: 'art',        label: 'Art & Craft',   icon: 'color-palette-outline' },
  { id: 'music',      label: 'Music',         icon: 'musical-notes-outline' },
  { id: 'dance',      label: 'Dance',         icon: 'accessibility-outline' },
  { id: 'stem',       label: 'STEM',          icon: 'hardware-chip-outline' },
  { id: 'stories',    label: 'Storytelling',  icon: 'book-outline' },
  { id: 'sensory',    label: 'Sensory Play',  icon: 'water-outline' },
  { id: 'drama',      label: 'Drama',         icon: 'megaphone-outline' },
  { id: 'nature',     label: 'Nature',        icon: 'leaf-outline' },
  { id: 'puzzles',    label: 'Puzzles',       icon: 'apps-outline' },
  { id: 'yoga',       label: 'Yoga',          icon: 'fitness-outline' },
]

const PLACEHOLDER_AVATARS = [
  'https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=200',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200',
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200',
]

const INTEREST_PILL_COLORS = [
  { bg: '#FFE8E2', text: colors.coral },
  { bg: colors.mint, text: colors.primary },
  { bg: '#EDE9FE', text: '#6B48D9' },
  { bg: '#FEF3C7', text: '#92400E' },
]

const TOTAL_STEPS = 3

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function ChildSetupScreen() {
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<Step>('info')

  // Step 1 state
  const [childName, setChildName]     = useState('')
  const [ageGroup, setAgeGroup]       = useState<(typeof AGE_OPTIONS)[0] | null>(null)
  const [gender, setGender]           = useState<string | null>(null)
  const [notes, setNotes]             = useState('')

  // Step 2 state
  const [interests, setInterests]     = useState<string[]>([])

  // Step 3 state
  const [avatarIdx, setAvatarIdx]     = useState<number | null>(null)

  const [loading, setLoading]         = useState(false)

  const stepNumber = step === 'info' ? 1 : step === 'interests' ? 2 : 3

  function toggleInterest(id: string) {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function completeOnboarding() {
    await supabase.auth.updateUser({ data: { onboardingStep: 'complete' } })
    setStep('success')
  }

  async function handleCreateProfile() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const midAge = ageGroup?.mid ?? 5
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - midAge)

      console.log("CHECKING CHIL AGE and ONBOARDING ");
      console.log("Child Age:", midAge);
      console.log("Date of Birth:", dob.toISOString().split('T')[0]);

      const { error } = await supabase.from('children').insert({
        parent_id:     user.id,
        first_name:    childName.trim(),
        date_of_birth: dob.toISOString().split('T')[0],
        interests:     interests,
        notes:         notes.trim() || null,
      })

      console.log("ERRROR ", error);

      if (error && error.code !== '42501') {
        Alert.alert(
          'Error',
          'Could not save profile. You can try again from the Kids tab.',
          [
            {
              text: 'OK',
              onPress: () => {
                void completeOnboarding()
              },
            },
          ],
        )
        return
      }

      await completeOnboarding()
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──
  if (step === 'success') {
    const selectedInterestLabels = INTERESTS
      .filter(i => interests.includes(i.id))
      .map(i => i.label)

    return (
      <View style={[styles.successContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Avatar */}
        {avatarIdx !== null ? (
          <Image
            source={{ uri: PLACEHOLDER_AVATARS[avatarIdx] }}
            style={styles.successAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.successAvatar, styles.successAvatarInitial]}>
            <Text style={styles.successAvatarText}>{childName[0]?.toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.successTitle}>Welcome, {childName}!</Text>
        <Text style={styles.successSubtitle}>
          {childName}'s profile has been created. Now let's find the perfect activities!
        </Text>

        {/* Interest pills */}
        {selectedInterestLabels.length > 0 && (
          <View style={styles.successPillsCard}>
            <View style={styles.successPillsRow}>
              {selectedInterestLabels.slice(0, 4).map((label, i) => {
                const col = INTEREST_PILL_COLORS[i % INTEREST_PILL_COLORS.length]
                return (
                  <View key={label} style={[styles.successPill, { backgroundColor: col.bg }]}>
                    <Text style={[styles.successPillText, { color: col.text }]}>{label}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        <View style={styles.successButtons}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.replace('/(root)/explore')}
          >
            <Text style={styles.outlineBtnText}>Browse Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(root)/kids')}
          >
            <Text style={styles.primaryBtnText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Wizard header (Steps 1–3) ──
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F6F4EF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Sticky top nav */}
      <View style={[styles.nav, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            if (step === 'info') router.back()
            else if (step === 'interests') setStep('info')
            else setStep('interests')
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Add a Child</Text>
          <Text style={styles.navStep}>Step {stepNumber} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(stepNumber / TOTAL_STEPS) * 100}%` as any }]} />
      </View>

      {/* Step content */}
      {step === 'info' && (
        <StepInfo
          childName={childName}
          ageGroup={ageGroup}
          gender={gender}
          notes={notes}
          onNameChange={setChildName}
          onAgeGroup={setAgeGroup}
          onGender={setGender}
          onNotes={setNotes}
          onNext={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setStep('interests')
          }}
          insetBottom={insets.bottom}
        />
      )}

      {step === 'interests' && (
        <StepInterests
          childName={childName}
          selected={interests}
          onToggle={toggleInterest}
          onNext={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setStep('photo')
          }}
          insetBottom={insets.bottom}
        />
      )}

      {step === 'photo' && (
        <StepPhoto
          childName={childName}
          avatarIdx={avatarIdx}
          onSelectAvatar={setAvatarIdx}
          onSkip={handleCreateProfile}
          onCreate={handleCreateProfile}
          loading={loading}
          insetBottom={insets.bottom}
        />
      )}
    </KeyboardAvoidingView>
  )
}

// ─────────────────────────────────────────────
// Step 1 — Info
// ─────────────────────────────────────────────

function StepInfo({
  childName, ageGroup, gender, notes,
  onNameChange, onAgeGroup, onGender, onNotes, onNext, insetBottom,
}: {
  childName: string
  ageGroup: (typeof AGE_OPTIONS)[0] | null
  gender: string | null
  notes: string
  onNameChange: (v: string) => void
  onAgeGroup: (v: (typeof AGE_OPTIONS)[0]) => void
  onGender: (v: string) => void
  onNotes: (v: string) => void
  onNext: () => void
  insetBottom: number
}) {
  const isValid = childName.trim().length >= 2 && ageGroup !== null && gender !== null

  return (
    <ScrollView
      contentContainerStyle={[styles.stepScroll, { paddingBottom: insetBottom + 100 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeading}>Tell us about your child</Text>
      <Text style={styles.stepSubheading}>This helps us personalize their experience</Text>

      <Text style={styles.fieldLabel}>Child's First Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Aarav, Prisha…"
        placeholderTextColor={colors.gray}
        value={childName}
        onChangeText={onNameChange}
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>Age Group <Text style={styles.required}>*</Text></Text>
      <View style={styles.chipGrid}>
        {AGE_OPTIONS.map(opt => {
          const active = ageGroup?.label === opt.label
          return (
            <TouchableOpacity
              key={opt.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onAgeGroup(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={styles.fieldLabel}>Gender <Text style={styles.required}>*</Text></Text>
      <View style={styles.chipGrid}>
        {GENDER_OPTIONS.map(g => {
          const active = gender === g
          return (
            <TouchableOpacity
              key={g}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onGender(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={styles.fieldLabel}>
        Any special notes?{' '}
        <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Allergies, sensory sensitivities, learning needs, or anything helpful…"
        placeholderTextColor={colors.gray}
        value={notes}
        onChangeText={onNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <StepButton label="Choose Interests" disabled={!isValid} onPress={onNext} />
    </ScrollView>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Interests
// ─────────────────────────────────────────────

function StepInterests({
  childName, selected, onToggle, onNext, insetBottom,
}: {
  childName: string
  selected: string[]
  onToggle: (id: string) => void
  onNext: () => void
  insetBottom: number
}) {
  const isValid = selected.length >= 1

  return (
    <ScrollView
      contentContainerStyle={[styles.stepScroll, { paddingBottom: insetBottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeading}>What does {childName || 'your child'} love?</Text>
      <Text style={styles.stepSubheading}>Pick at least 1 interest — we'll curate activities around them</Text>

      <View style={styles.interestGrid}>
        {INTERESTS.map(item => {
          const active = selected.includes(item.id)
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.interestCard, active && styles.interestCardActive]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onToggle(item.id)
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={item.icon as any}
                size={28}
                color={active ? colors.primary : colors.gray}
              />
              <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <StepButton label="Add Photo" disabled={!isValid} onPress={onNext} />
    </ScrollView>
  )
}

// ─────────────────────────────────────────────
// Step 3 — Photo
// ─────────────────────────────────────────────

function StepPhoto({
  childName, avatarIdx, onSelectAvatar, onSkip, onCreate, loading, insetBottom,
}: {
  childName: string
  avatarIdx: number | null
  onSelectAvatar: (i: number) => void
  onSkip: () => void
  onCreate: () => void
  loading: boolean
  insetBottom: number
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.stepScroll, { paddingBottom: insetBottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepHeading}>Add {childName || "your child"}'s photo</Text>
      <Text style={styles.stepSubheading}>Helps teachers recognise your child at a glance (optional)</Text>

      {/* Upload area */}
      <TouchableOpacity style={styles.uploadArea} activeOpacity={0.85}>
        <Ionicons name="camera-outline" size={36} color={colors.primary} />
        <Text style={styles.uploadTitle}>Take a Photo or Upload</Text>
        <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
      </TouchableOpacity>

      <Text style={styles.orLabel}>Or choose a placeholder avatar</Text>

      <View style={styles.avatarRow}>
        {PLACEHOLDER_AVATARS.map((uri, i) => (
          <TouchableOpacity
            key={i}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onSelectAvatar(i)
            }}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri }}
              style={[styles.placeholderAvatar, avatarIdx === i && styles.placeholderAvatarActive]}
              contentFit="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      <StepButton label="Create Profile" disabled={loading} loading={loading} onPress={onCreate} />

      <TouchableOpacity style={styles.skipLink} onPress={onSkip}>
        <Text style={styles.skipText}>Skip photo for now</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────
// Shared bottom CTA button
// ─────────────────────────────────────────────

function StepButton({ label, disabled, loading, onPress }: {
  label: string
  disabled?: boolean
  loading?: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>
        {loading ? 'Creating…' : label}
      </Text>
      {!disabled && !loading && (
        <Ionicons name="chevron-forward" size={18} color={disabled ? colors.gray : colors.white} />
      )}
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  // Navigation
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#F6F4EF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  navCenter: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  navStep: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2 },

  // Progress bar
  progressTrack: { height: 3, backgroundColor: colors.border, marginBottom: spacing.xs },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

  // Step shared
  stepScroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, gap: spacing.md },
  stepHeading: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy, lineHeight: 34 },
  stepSubheading: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 22, marginTop: -spacing.sm },

  // Fields
  fieldLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  required: { color: colors.coral },
  optional: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
  },
  textarea: {
    height: 100,
    paddingTop: spacing.sm + 4,
    textAlignVertical: 'top',
  },

  // Chips (age + gender)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  chipText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  chipTextActive: { color: colors.primary },

  // Interest grid
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  interestCard: {
    width: '47.5%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  interestCardActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  interestLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  interestLabelActive: { color: colors.navy },

  // Photo step
  uploadArea: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    backgroundColor: colors.mint + '55',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl + spacing.md,
    gap: spacing.sm,
  },
  uploadTitle: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.primary },
  uploadHint: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  orLabel: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  avatarRow: { flexDirection: 'row', gap: spacing.md },
  placeholderAvatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: 'transparent',
  },
  placeholderAvatarActive: { borderColor: colors.primary },

  // CTA button
  primaryBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.white,
  },
  primaryBtnTextDisabled: { color: colors.gray },

  skipLink: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },

  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: '#F6F4EF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  successAvatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: colors.primary,
  },
  successAvatarInitial: {
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successAvatarText: {
    fontSize: 40, fontFamily: 'Nunito-Bold', color: colors.primary,
  },
  successTitle: {
    fontSize: fontSize.h1, fontFamily: 'Nunito-Bold',
    color: colors.navy, textAlign: 'center',
  },
  successSubtitle: {
    fontSize: fontSize.body, fontFamily: 'Nunito-Regular',
    color: colors.gray, textAlign: 'center', lineHeight: 24,
    marginTop: -spacing.sm,
  },
  successPillsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  successPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  successPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.avatar,
  },
  successPillText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold' },
  successButtons: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  outlineBtn: {
    flex: 1, height: 52,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  outlineBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
})
