import React, { useState } from 'react'
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
import { Button } from '@/components/Button'

const MOCK_PHONE = '9999999999'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const isValid = phone.replace(/\s/g, '').length === 10

  const handleSendOTP = async () => {
    if (!isValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const cleanPhone = phone.replace(/\s/g, '')
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
            Enter your phone number to get a one-time code
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
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
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
            />
          </View>

          <Button
            label={loading ? 'Sending…' : 'Send OTP'}
            variant="primary"
            onPress={handleSendOTP}
            disabled={!isValid || loading}
            loading={loading}
          />

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://beamkids.in/terms')}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://beamkids.in/privacy')}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.illustration}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.primary} />
          <Text style={styles.illustrationText}>
            We'll send a 6-digit code to verify your number
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
    marginBottom: spacing['2xl'],
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
  form: {
    gap: spacing.md,
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
    gap: spacing.md,
  },
  illustrationText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
})
