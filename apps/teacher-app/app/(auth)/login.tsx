import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../../src/components/Button'
import { Screen } from '../../src/components/Screen'
import { supabase } from '../../src/lib/supabase'
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/constants/theme'

export default function LoginScreen() {
  const [phone, setPhone] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSendOtp = async () => {
    const trimmed = phone.trim()
    if (!trimmed) {
      setError('Please enter your phone number.')
      return
    }

    // Normalise to E.164: strip spaces/dashes, ensure +91 prefix
    const digits = trimmed.replace(/\D/g, '')
    const e164 = digits.startsWith('91') ? `+${digits}` : `+91${digits}`

    // Mock mode: bypass Supabase OTP for test number
    if (digits === '9999999999') {
      router.push({ pathname: '/(auth)/otp', params: { phone: e164, mock: '1' } })
      return
    }

    setLoading(true)
    setError('')

    const { error: supabaseError } = await supabase.auth.signInWithOtp({ phone: e164 })

    setLoading(false)

    if (supabaseError) {
      // Never expose raw Supabase errors to the user
      setError('Your number is not registered. Contact your Beam admin.')
      return
    }

    router.push({ pathname: '/(auth)/otp', params: { phone: e164 } })
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your registered phone number to receive a one-time code.</Text>
      </View>

      {/* Phone input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone number</Text>
        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            accessibilityLabel="Phone number"
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={setPhone}
            placeholder="98765 43210"
            placeholderTextColor={colors.gray}
            returnKeyType="done"
            onSubmitEditing={handleSendOtp}
            style={styles.input}
            value={phone}
          />
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      {/* CTA */}
      <Button label={loading ? 'Sending…' : 'Send OTP'} onPress={handleSendOtp} />

      {/* Invite note */}
      <Text style={styles.note}>
        Only admin-registered numbers can log in. If you were invited to join Beam as a teacher, check your phone number with your coordinator.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.navy,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.gray,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    color: colors.navy,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  prefix: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.lightGray,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  prefixText: {
    color: colors.navy,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    color: colors.navy,
    fontSize: fontSize.bodyLg,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.caption,
  },
  note: {
    color: colors.gray,
    fontSize: fontSize.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 'auto',
  },
})
