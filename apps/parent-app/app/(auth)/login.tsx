import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { parentApi } from '@/lib/api'
import { Button } from '@/components/Button'

const MOCK_PHONE = '9999999999'
const BYPASS_SUPABASE_EMAIL_SIGNUP =
  process.env.EXPO_PUBLIC_BYPASS_SUPABASE_EMAIL_SIGNUP === 'true'

type AuthMethod = 'phone' | 'email'
type EmailMode = 'login' | 'register'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [firstNameFocused, setFirstNameFocused] = useState(false)
  const [lastNameFocused, setLastNameFocused] = useState(false)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)

  const cleanPhone = phone.replace(/\s/g, '')
  const normalizedEmail = email.trim().toLowerCase()
  const isPhoneValid = cleanPhone.length === 10
  const isEmailValid = /\S+@\S+\.\S+/.test(normalizedEmail)
  const isPasswordValid = password.length >= 8
  const isRegisterMode = authMethod === 'email' && emailMode === 'register'

  const canSubmit = useMemo(() => {
    if (authMethod === 'phone') return isPhoneValid
    if (!isEmailValid || !isPasswordValid) return false
    if (!isRegisterMode) return true
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 1 &&
      confirmPassword === password
    )
  }, [
    authMethod,
    confirmPassword,
    firstName,
    isEmailValid,
    isPasswordValid,
    isPhoneValid,
    isRegisterMode,
    lastName,
    password,
  ])

  const routeFromOnboardingStep = (onboardingStep?: string) => {
    if (!onboardingStep) {
      router.replace('/(auth)/parent-setup')
      return
    }
    if (onboardingStep === 'parent-done') {
      router.replace('/(auth)/child-setup')
      return
    }
    router.replace('/(root)/')
  }

  const resetEmailErrors = () => {
    setShowRegisterPrompt(false)
  }

  const handleSendOTP = async () => {
    if (!isPhoneValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      if (cleanPhone === MOCK_PHONE) {
        router.push({ pathname: '/(auth)/otp', params: { phone: cleanPhone } })
        return
      }
      const { error } = await supabase.auth.signInWithOtp({ phone: `+91${cleanPhone}` })
      if (error) {
        Alert.alert('Error', error.message)
        return
      }
      router.push({ pathname: '/(auth)/otp', params: { phone: cleanPhone } })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    if (!canSubmit) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    resetEmailErrors()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (error) {
        setShowRegisterPrompt(true)
        Alert.alert('Unable to sign in', error.message)
        return
      }
      routeFromOnboardingStep(data.user?.user_metadata?.onboardingStep)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegistration = async () => {
    if (!canSubmit) return
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Confirm password must match the password.')
      return
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    resetEmailErrors()
    try {
      if (BYPASS_SUPABASE_EMAIL_SIGNUP) {
        await parentApi.users.registerParent({
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
        Alert.alert(
          'Parent added',
          'Supabase email signup is bypassed in this environment. The parent row was created in Beam, but email/password login will not work until Supabase signup is re-enabled.',
        )
        setEmailMode('login')
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'parent',
            onboardingStep: '',
            authMethod: 'email',
          },
        },
      })

      if (error) {
        Alert.alert('Unable to register', error.message)
        return
      }

      const authUser = data.user
      if (!authUser) {
        Alert.alert('Registration started', 'Check your email to confirm the account, then sign in.')
        setEmailMode('login')
        return
      }

      try {
        await parentApi.users.registerParent({
          userId: authUser.id,
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      } catch (registrationError) {
        const message = registrationError instanceof Error ? registrationError.message : 'Unable to create parent profile.'
        if (message !== 'Parent account already exists') {
          Alert.alert('Registration incomplete', message)
          return
        }
      }

      if (!data.session) {
        Alert.alert('Verify your email', 'Your account is created. Verify your email, then sign in.')
        setEmailMode('login')
        return
      }

      routeFromOnboardingStep(authUser.user_metadata?.onboardingStep)
    } finally {
      setLoading(false)
    }
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
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            {authMethod === 'phone'
              ? 'Enter your phone number to get a one-time code'
              : emailMode === 'login'
                ? 'Sign in with your email and password'
                : BYPASS_SUPABASE_EMAIL_SIGNUP
                  ? 'Create a parent row directly in Beam for local testing'
                  : 'Create your parent account with email and password'}
          </Text>
        </View>
{/* THIS IS TO BLOCK PHONE LOGIN... un comment this later */}
        {/* <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, authMethod === 'phone' && styles.toggleChipActive]}
            onPress={() => setAuthMethod('phone')}
          >
            <Text style={[styles.toggleText, authMethod === 'phone' && styles.toggleTextActive]}>
              Phone OTP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, authMethod === 'email' && styles.toggleChipActive]}
            onPress={() => setAuthMethod('email')}
          >
            <Text style={[styles.toggleText, authMethod === 'email' && styles.toggleTextActive]}>
              Email Login
            </Text>
          </TouchableOpacity>
        </View> */}

        {authMethod === 'email' ? (
          <View style={styles.emailModeRow}>
            <TouchableOpacity onPress={() => { setEmailMode('login'); resetEmailErrors() }}>
              <Text style={[styles.modeText, emailMode === 'login' && styles.modeTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmailMode('register'); resetEmailErrors() }}>
              <Text style={[styles.modeText, emailMode === 'register' && styles.modeTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.form}>
          {authMethod === 'phone' ? (
            <>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputRow, phoneFocused && styles.inputRowFocused]}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>IN  +91</Text>
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  autoFocus
                />
              </View>

              <Button
                label={loading ? 'Sending…' : 'Send OTP'}
                variant="primary"
                onPress={handleSendOTP}
                disabled={!canSubmit || loading}
                loading={loading}
              />
            </>
          ) : (
            <>
              {isRegisterMode ? (
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                      style={[styles.textInput, firstNameFocused && styles.textInputFocused]}
                      placeholder="Priya"
                      placeholderTextColor={colors.gray}
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={() => setFirstNameFocused(true)}
                      onBlur={() => setFirstNameFocused(false)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                      style={[styles.textInput, lastNameFocused && styles.textInputFocused]}
                      placeholder="Sharma"
                      placeholderTextColor={colors.gray}
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={() => setLastNameFocused(true)}
                      onBlur={() => setLastNameFocused(false)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              ) : null}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.textInput, emailFocused && styles.textInputFocused]}
                placeholder="parent@example.com"
                placeholderTextColor={colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(value) => {
                  setEmail(value)
                  resetEmailErrors()
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoFocus
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.textInput, passwordFocused && styles.textInputFocused]}
                placeholder="Minimum 8 characters"
                placeholderTextColor={colors.gray}
                secureTextEntry
                value={password}
                onChangeText={(value) => {
                  setPassword(value)
                  resetEmailErrors()
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />

              {isRegisterMode ? (
                <>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={[styles.textInput, confirmPasswordFocused && styles.textInputFocused]}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.gray}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                  />
                </>
              ) : null}

              <Button
                label={
                  loading
                    ? isRegisterMode ? 'Creating…' : 'Signing in…'
                    : isRegisterMode ? 'Create Account' : 'Sign In'
                }
                variant="primary"
                onPress={isRegisterMode ? handleEmailRegistration : handleEmailLogin}
                disabled={!canSubmit || loading}
                loading={loading}
              />

              {!isRegisterMode && showRegisterPrompt ? (
                <TouchableOpacity
                  style={styles.registerPrompt}
                  onPress={() => setEmailMode('register')}
                >
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                  <Text style={styles.registerPromptText}>
                    Email not registered? Create a parent account
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://beamkids.in/terms')}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://beamkids.in/privacy')}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.illustration}>
          <Ionicons
            name={authMethod === 'phone' ? 'phone-portrait-outline' : 'mail-outline'}
            size={48}
            color={colors.primary}
          />
          <Text style={styles.illustrationText}>
            {authMethod === 'phone'
              ? "We'll send a 6-digit code to verify your number"
              : isRegisterMode
                ? BYPASS_SUPABASE_EMAIL_SIGNUP
                  ? 'Supabase signup is bypassed. This only creates the parent record in Beam.'
                  : 'Your parent profile will be created after registration'
                : 'Use your registered email to access your parent dashboard'}
          </Text>
        </View>
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
    fontSize: 28,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.bodyLg,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  toggleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  toggleText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
  },
  toggleTextActive: {
    color: colors.primary,
  },
  emailModeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  modeText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
  },
  modeTextActive: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
    marginBottom: -spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    height: 52,
    backgroundColor: colors.lightGray,
    overflow: 'hidden',
  },
  inputRowFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  countryCode: {
    paddingHorizontal: spacing.md,
  },
  countryCodeText: {
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-SemiBold',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    letterSpacing: 1,
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    backgroundColor: colors.lightGray,
  },
  textInputFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  registerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerPromptText: {
    fontSize: fontSize.body,
    color: colors.primary,
    fontFamily: 'Nunito-SemiBold',
  },
  terms: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
    fontFamily: 'Nunito-SemiBold',
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  illustrationText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
})
