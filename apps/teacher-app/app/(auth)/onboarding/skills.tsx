import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, Pressable, View } from 'react-native'
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

const CATEGORIES = [
  { name: 'Art', icon: 'color-palette-outline' },
  { name: 'Music', icon: 'musical-notes-outline' },
  { name: 'Dance', icon: 'footsteps-outline' },
  { name: 'Sports', icon: 'football-outline' },
  { name: 'STEM', icon: 'flask-outline' },
  { name: 'Cooking', icon: 'restaurant-outline' },
  { name: 'Yoga', icon: 'body-outline' },
  { name: 'Language', icon: 'language-outline' },
  { name: 'Theatre', icon: 'happy-outline' },
] as const

const AGE_GROUPS = [
  { name: '2–4 yrs', label: 'Toddler', icon: 'baby-outline' },
  { name: '4–6 yrs', label: 'Preschool', icon: 'school-outline' },
  { name: '6–9 yrs', label: 'Primary', icon: 'book-outline' },
  { name: '9–12 yrs', label: 'Pre-teen', icon: 'trending-up-outline' },
] as const

function GridGroup({
  label,
  options,
  selected,
  onToggle,
  isAgeGroup = false,
}: {
  label: string
  options: readonly { readonly name: string; readonly icon: keyof typeof Ionicons.prototype.props.name; readonly label?: string }[]
  selected: string[]
  onToggle: (v: string) => void
  isAgeGroup?: boolean
}) {
  return (
    <View style={gg.group}>
      <Text style={gg.label}>{label}</Text>
      <View style={gg.grid}>
        {options.map((opt) => {
          const active = selected.includes(opt.name)
          return (
            <Pressable
              key={opt.name}
              onPress={() => onToggle(opt.name)}
              style={({ pressed }) => [
                gg.card,
                isAgeGroup ? gg.cardHalf : gg.cardThird,
                active ? gg.cardActive : gg.cardInactive,
                pressed && gg.cardPressed,
              ]}
            >
              <Ionicons
                name={opt.icon}
                size={isAgeGroup ? 24 : 22}
                color={active ? colors.white : colors.primary}
                style={gg.icon}
              />
              <Text style={[gg.cardText, active ? gg.cardTextActive : gg.cardTextInactive]}>
                {opt.name}
              </Text>
              {opt.label && (
                <Text style={[gg.cardSub, active ? gg.cardSubActive : gg.cardSubInactive]}>
                  {opt.label}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const gg = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { color: colors.navy, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardThird: {
    width: '31%',
  },
  cardHalf: {
    width: '47.8%',
  },
  cardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    elevation: 3,
  },
  cardInactive: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  cardText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  cardTextActive: {
    color: colors.white,
  },
  cardTextInactive: {
    color: colors.navy,
  },
  cardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  cardSubActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardSubInactive: {
    color: colors.gray,
  },
})

export default function OnboardingSkillsScreen() {
  const [categories, setCategories] = React.useState<string[]>([])
  const [ageGroups, setAgeGroups] = React.useState<string[]>([])
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const handleContinue = async () => {
    if (categories.length === 0 || ageGroups.length === 0) {
      setError('Please select at least one category and one age group.')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      data: { specializations: categories, ageGroups },
    })

    setLoading(false)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      return
    }

    router.push('/(auth)/onboarding/availability')
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <ProgressBar step={2} total={3} />

      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>Your expertise</Text>
        <Text style={styles.subtitle}>Select the areas and age groups you teach.</Text>
      </View>

      <View style={styles.content}>
        <GridGroup
          label="Activity categories"
          options={CATEGORIES}
          selected={categories}
          onToggle={(v) => toggle(categories, setCategories, v)}
        />

        <View style={styles.divider} />

        <GridGroup
          label="Age groups"
          options={AGE_GROUPS}
          selected={ageGroups}
          onToggle={(v) => toggle(ageGroups, setAgeGroups, v)}
          isAgeGroup
        />
      </View>

      {!!error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <Button
        label={loading ? 'Saving…' : 'Continue'}
        onPress={handleContinue}
        style={styles.btn}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    backgroundColor: '#F8FBFD',
  },
  header: { gap: 4 },
  step: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  title: { color: colors.navy, fontSize: fontSize.h1, fontWeight: fontWeight.bold },
  subtitle: { color: colors.gray, fontSize: fontSize.bodyLg, lineHeight: 22 },
  content: { gap: spacing.lg },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.input,
  },
  error: { color: colors.error, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  btn: { marginTop: spacing.md },
})

