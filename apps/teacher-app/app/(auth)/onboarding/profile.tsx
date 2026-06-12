import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
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

export default function OnboardingProfileScreen() {
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [city, setCity] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim() || !city.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      data: { firstName: firstName.trim(), lastName: lastName.trim(), city: city.trim(), bio: bio.trim() },
    })

    setLoading(false)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      return
    }

    router.push('/(auth)/onboarding/skills')
  }

  const getBioCountColor = () => {
    if (bio.length >= 180) return colors.error
    if (bio.length >= 140) return colors.warning
    return colors.gray
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <ProgressBar step={1} total={3} />

      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>Help parents and families get to know you.</Text>
      </View>

      <View style={styles.form}>
        <Field
          label="First name *"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Priya"
          icon="person-outline"
        />
        <Field
          label="Last name *"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Sharma"
          icon="person-outline"
        />
        <Field
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="Bengaluru"
          icon="map-outline"
        />
        <Field
          label="Short bio"
          value={bio}
          onChangeText={(v) => setBio(v.slice(0, 200))}
          placeholder="Experienced art teacher passionate about nurturing creativity in young learners…"
          multiline
          maxLength={200}
          style={styles.bioInput}
          icon="document-text-outline"
        />
        {bio.length > 0 && (
          <Text style={[styles.charCount, { color: getBioCountColor() }]}>
            {bio.length}/200
          </Text>
        )}
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  style,
  icon,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  multiline?: boolean
  maxLength?: number
  style?: object
  icon: keyof typeof Ionicons.prototype.props.name
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <View style={field.group}>
      <Text style={field.label}>{label}</Text>
      <View
        style={[
          field.inputContainer,
          isFocused && field.inputContainerFocused,
          multiline && field.inputContainerMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isFocused ? colors.primary : colors.gray}
          style={[field.icon, multiline && field.iconMultiline]}
        />
        <TextInput
          multiline={multiline}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          style={[field.input, style]}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  )
}

const field = StyleSheet.create({
  group: { gap: 6 },
  label: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  iconMultiline: {
    marginTop: 4,
  },
  input: {
    flex: 1,
    color: colors.navy,
    fontSize: fontSize.bodyLg,
    paddingVertical: 8,
  },
})

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
  form: { gap: spacing.md },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: colors.gray, fontSize: fontSize.caption, textAlign: 'right', marginTop: -spacing.xs },
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

