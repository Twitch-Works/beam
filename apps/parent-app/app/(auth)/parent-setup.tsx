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
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad']

export default function ParentSetupScreen() {
  const insets = useSafeAreaInsets()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [city, setCity]           = useState('')
  const [loading, setLoading]     = useState(false)

  const isValid = firstName.trim().length >= 2 && city.trim().length >= 2

  const handleContinue = async () => {
    if (!isValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { firstName: firstName.trim(), lastName: lastName.trim(), city: city.trim(), role: 'parent', onboardingStep: 'parent-done' },
      })
      if (error) {
        Alert.alert('Error', error.message)
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
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>We'll personalise your experience based on your location</Text>
        </View>

        <View style={styles.form}>
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
              <Text style={styles.label}>Last Name</Text>
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
