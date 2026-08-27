import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, radius, spacing } from '@/constants/theme'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'

const AGE_BANDS = ['2-4', '5-7', '8-10', '10+']

const INTERESTS = [
  'Art & Craft',
  'Sports',
  'Music',
  'Dance',
  'STEM',
  'Storytelling',
  'Yoga',
  'Cooking',
]

export default function LateOnboardingPreferencesScreen() {
  const insets = useSafeAreaInsets()
  const { state, setPreferences, markCompleted } = useLateOnboarding()
  const [ageBand, setAgeBand] = React.useState(state.ageBand ?? '5-7')
  const [interests, setInterests] = React.useState<string[]>(state.interests)

  const isValid = interests.length > 0

  const toggleInterest = async (interest: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    )
  }

  const handleContinue = async () => {
    if (!isValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await setPreferences({ ageBand, interests })
    await markCompleted()
    router.replace('/(root)/')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>beam ✦</Text>
          <Text style={styles.step}>Step 2 of 2</Text>
          <Text style={styles.title}>Tell us about your child</Text>
          <Text style={styles.subtitle}>
            We&apos;ll use age band and interests to shape the initial recommendations before login.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Child age</Text>
          <View style={styles.row}>
            {AGE_BANDS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, ageBand === item && styles.chipActive]}
                onPress={() => setAgeBand(item)}
              >
                <Text style={[styles.chipText, ageBand === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.row}>
            {INTERESTS.map((item) => {
              const active = interests.includes(item)
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => void toggleInterest(item)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>See Recommendations →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  header: {
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  step: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.h1,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-SemiBold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.avatar,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  chipText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
  },
  chipTextActive: {
    color: colors.primary,
  },
  primaryButton: {
    height: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
})
