import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Button } from '../../src/components/Button'
import { Screen } from '../../src/components/Screen'
import { useAuth } from '../../src/lib/AuthContext'
import { supabase } from '../../src/lib/supabase'
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/constants/theme'

const RESEND_COUNTDOWN = 30

export default function OtpScreen() {
  const { phone, mock } = useLocalSearchParams<{ phone: string; mock?: string }>()
  const { setMockSession } = useAuth()
  const [otp, setOtp] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [countdown, setCountdown] = React.useState(RESEND_COUNTDOWN)

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }

    // Mock mode: accept 000000 and go straight to dashboard
    if (mock === '1') {
      if (otp !== '000000') {
        setError('Mock mode: use code 000000')
        return
      }
      setMockSession(true)
      router.replace('/(root)')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: supabaseError } = await supabase.auth.verifyOtp({
      phone: phone ?? '',
      token: otp,
      type: 'sms',
    })

    setLoading(false)

    if (supabaseError || !data.session) {
      setError('Incorrect or expired code. Please try again.')
      return
    }

    const role = data.session.user.user_metadata?.role
    if (role !== 'teacher') {
      await supabase.auth.signOut()
      setError('Access denied. This app is for teachers only.')
      return
    }

    const onboardingComplete = data.session.user.user_metadata?.onboarding_complete
    if (onboardingComplete) {
      router.replace('/(root)')
    } else {
      router.replace('/(auth)/onboarding/profile')
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !phone) return
    await supabase.auth.signInWithOtp({ phone })
    setCountdown(RESEND_COUNTDOWN)
    setOtp('')
    setError('')
  }

  const maskedPhone = phone ? `${phone.slice(0, 3)}••••${phone.slice(-4)}` : ''

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
        </Text>
      </View>

      {/* OTP input */}
      <TextInput
        accessibilityLabel="One-time password"
        autoFocus
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={(v) => {
          setOtp(v)
          setError('')
        }}
        onSubmitEditing={handleVerify}
        placeholder="••••••"
        placeholderTextColor={colors.border}
        style={styles.otpInput}
        value={otp}
      />

      {mock === '1' && !error && (
        <Text style={styles.mockHint}>Mock mode — use code 000000</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button label={loading ? 'Verifying…' : 'Verify'} onPress={handleVerify} />

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
          <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
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
  phone: {
    color: colors.navy,
    fontWeight: fontWeight.bold,
  },
  otpInput: {
    height: 64,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    color: colors.navy,
    fontSize: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: 12,
    textAlign: 'center',
    backgroundColor: colors.mint,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    color: colors.gray,
    fontSize: fontSize.body,
  },
  resendLink: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  resendDisabled: {
    color: colors.gray,
  },
  mockHint: {
    color: colors.primary,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
})
