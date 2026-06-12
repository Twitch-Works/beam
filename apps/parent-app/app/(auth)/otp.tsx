import React, { useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/Button'

const MOCK_PHONE = '9999999999'
const MOCK_OTP   = '123456'

const OTP_LENGTH = 6
const RESEND_TIMER = 30

export default function OTPScreen() {
  const insets = useSafeAreaInsets()
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const { setMockSession } = useAuth()

  if (!phone) return <Redirect href="/(auth)/login" />
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(RESEND_TIMER)
  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timer])

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return
    const next = [...otp]
    next[index] = text.slice(-1)
    setOtp(next)
    setError('')
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    if (next.every(Boolean) && next.join('').length === OTP_LENGTH) {
      handleVerify(next.join(''))
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code?: string) => {
    const fullCode = code ?? otp.join('')
    if (fullCode.length < OTP_LENGTH) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    setError('')
    try {
      if (phone === MOCK_PHONE) {
        if (fullCode !== MOCK_OTP) {
          setError('Invalid code. Use 123456 for test number.')
          setOtp(Array(OTP_LENGTH).fill(''))
          inputRefs.current[0]?.focus()
          return
        }
        setMockSession(true)
        router.replace('/(root)/')
        return
      }
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: fullCode,
        type: 'sms',
      })
      if (verifyError) {
        setError('Invalid code. Please try again.')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
        return
      }
      const { data: { user: freshUser } } = await supabase.auth.getUser()
      const onboardingStep = freshUser?.user_metadata?.onboardingStep
      if (!onboardingStep || onboardingStep === '') {
        router.replace('/(auth)/parent-setup')
      } else if (onboardingStep === 'parent-done') {
        router.replace('/(auth)/child-setup')
      } else {
        router.replace('/(root)/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setOtp(Array(OTP_LENGTH).fill(''))
    setTimer(RESEND_TIMER)
    setError('')
    inputRefs.current[0]?.focus()
    if (phone !== MOCK_PHONE) {
      await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
    }
  }

  const filled = otp.filter(Boolean).length

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.phone}>+91 {phone}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                error ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={loading ? 'Verifying…' : 'Verify & Continue'}
          variant="primary"
          onPress={() => handleVerify()}
          disabled={filled < OTP_LENGTH || loading}
          loading={loading}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.white },
  back: { marginBottom: spacing.xl },
  backText: { fontSize: fontSize.body, color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  header: { marginBottom: spacing.xl },
  title: { fontSize: fontSize.h1, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.navy, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.bodyLg, color: colors.gray, fontFamily: 'Nunito-Regular', lineHeight: 24 },
  phone: { color: colors.navy, fontFamily: 'Nunito-Bold' },
  otpRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  otpBox: {
    flex: 1, height: 56, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.input,
    textAlign: 'center', fontSize: fontSize.h2, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold',
    color: colors.navy, backgroundColor: colors.lightGray,
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.mint, color: colors.primary },
  otpBoxError: { borderColor: colors.error, backgroundColor: '#FFF0F0' },
  error: { fontSize: fontSize.caption, color: colors.error, fontFamily: 'Nunito-Regular', textAlign: 'center', marginBottom: spacing.md },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: fontSize.body, color: colors.gray, fontFamily: 'Nunito-Regular' },
  timerText: { fontSize: fontSize.body, color: colors.gray, fontFamily: 'Nunito-SemiBold' },
  resendLink: { fontSize: fontSize.body, color: colors.primary, fontFamily: 'Nunito-Bold' },
})
