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
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { parentApi } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad']
function formatPhoneForInput(phone?: string | null) {
  return (phone ?? '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10)
}

export default function ParentSetupScreen() {
  const insets = useSafeAreaInsets()
  const { user, parentUserId } = useAuth()
  const existingFirstName = (user?.user_metadata?.firstName as string | undefined)?.trim() ?? ''
  const existingLastName = (user?.user_metadata?.lastName as string | undefined)?.trim() ?? ''
  const existingCity = (user?.user_metadata?.city as string | undefined)?.trim() ?? ''
  const existingPhone = formatPhoneForInput(
    typeof user?.phone === 'string' && user.phone.length > 0
      ? user.phone
      : (user?.user_metadata?.phone as string | undefined),
  )

  const needsName = !existingFirstName || !existingLastName
  const needsPhone = !existingPhone

  const [firstName, setFirstName] = useState(existingFirstName)
  const [lastName, setLastName]   = useState(existingLastName)
  const [city, setCity]           = useState(existingCity)
  const [phone, setPhone]         = useState(existingPhone)
  const [loading, setLoading]     = useState(false)

  const isValid = useMemo(() => {
    const hasName = needsName ? firstName.trim().length >= 2 && lastName.trim().length >= 1 : true
    const hasPhone = needsPhone ? phone.trim().length === 10 : true
    return hasName && hasPhone && city.trim().length >= 2
  }, [city, firstName, lastName, needsName, needsPhone, phone])

  const handleContinue = async () => {
    if (!isValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'You need to sign in again.')
        return
      }

      const resolvedFirstName = needsName ? firstName.trim() : existingFirstName
      const resolvedLastName = needsName ? lastName.trim() : existingLastName
      const resolvedPhone = needsPhone ? `+91${phone.trim()}` : (user.phone || (user.user_metadata?.phone as string | undefined) || '')

      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          city: city.trim(),
          phone: resolvedPhone,
          role: 'parent',
          onboardingStep: 'parent-done',
        },
      })
      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      try {
        if (!parentUserId) {
          Alert.alert('Error', 'Parent profile could not be resolved. Please sign in again.')
          return
        }

        await parentApi.users.updateProfile({
          userId: parentUserId,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          city: city.trim(),
          phone: resolvedPhone,
        })
      } catch (updateError) {
        const message = updateError instanceof Error ? updateError.message : 'Could not sync profile details.'
        Alert.alert('Error', message)
        return
      }

      router.replace('/(auth)/child-setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>beam ✦</Text>
          <Text style={styles.step}>Step 1 of 2</Text>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            {needsName || needsPhone
              ? 'We need a few more details before you can start booking.'
              : "We'll personalise your experience based on your location."}
          </Text>
        </View>

        <View style={styles.form}>
          {needsName ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Priya"
                  placeholderTextColor={colors.gray}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sharma"
                  placeholderTextColor={colors.gray}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Name</Text>
              <Text style={styles.infoValue}>{[existingFirstName, existingLastName].filter(Boolean).join(' ')}</Text>
            </View>
          )}

          {needsPhone ? (
            <>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>IN  +91</Text>
                </View>
                <View style={styles.divider} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </>
          ) : null}

          <Text style={styles.label}>City *</Text>
          <View style={styles.cityGrid}>
            {CITIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                onPress={() => setCity(c)}
              >
                <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!CITIES.includes(city) && (
            <TextInput
              style={[styles.input, { marginTop: spacing.sm }]}
              placeholder="Other city..."
              placeholderTextColor={colors.gray}
              value={CITIES.includes(city) ? '' : city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (!isValid || loading) && styles.primaryBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Saving…' : 'Continue →'}</Text>
          </TouchableOpacity>
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
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-Bold',
  },
  label: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  input: {
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
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    letterSpacing: 1,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  cityChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
  },
  cityChipTextActive: {
    color: colors.primary,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
})
