import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { ScreenHeader } from '@/components/ScreenHeader'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'

export default function EditChildScreen() {
  const insets = useSafeAreaInsets()
  const { id, firstName: initialFirst, lastName: initialLast, dob: initialDob } =
    useLocalSearchParams<{ id: string; firstName: string; lastName: string; dob: string }>()
  const { parentUserId } = useAuth()
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = useState(initialFirst ?? '')
  const [lastName, setLastName]   = useState(initialLast ?? '')
  const [dob, setDob]             = useState(initialDob ?? '')
  const [saving, setSaving]       = useState(false)

  const hasChanges =
    firstName !== (initialFirst ?? '') ||
    lastName  !== (initialLast ?? '')  ||
    dob       !== (initialDob ?? '')

  const handleSave = async () => {
    if (!firstName.trim()) { Alert.alert('Required', 'First name cannot be empty.'); return }
    if (!parentUserId || !id) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSaving(true)
    try {
      await parentApi.children.update(id, parentUserId, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        dateOfBirth: dob || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (err: any) {
      Alert.alert('Could not save', err?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Edit Child Profile" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Field label="First Name *" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name (optional)" />
          <Field
            label="Date of Birth (YYYY-MM-DD)"
            value={dob}
            onChangeText={setDob}
            placeholder="e.g. 2019-06-15"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!hasChanges || saving) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function Field({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType']
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="words"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },

  scroll: { padding: spacing.md, gap: spacing.md },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.lg,
    ...shadows.card,
  },

  field: { gap: spacing.xs },
  label: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
    backgroundColor: colors.lightGray,
  },

  saveBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  saveBtnText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
})
