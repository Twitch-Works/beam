import React from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

export default function ParentProfileEditScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [firstName, setFirstName] = React.useState((user?.user_metadata?.firstName as string) ?? '')
  const [lastName,  setLastName]  = React.useState((user?.user_metadata?.lastName  as string) ?? '')
  const [city,      setCity]      = React.useState((user?.user_metadata?.city      as string) ?? '')
  const [isSaving,  setIsSaving]  = React.useState(false)

  const canSave = firstName.trim() && !isSaving

  const handleSave = async () => {
    if (!user?.id || !canSave) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsSaving(true)
    try {
      await parentApi.users.updateProfile({ userId: user.id, firstName: firstName.trim(), lastName: lastName.trim(), city: city.trim() })
      router.back()
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Info</Text>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.gray}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.gray}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Bengaluru"
              placeholderTextColor={colors.gray}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.phone ?? '—'}
              editable={false}
            />
            <Text style={styles.hint}>Phone number cannot be changed here</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          disabled={!canSave}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  headerSpacer: { width: 36 },
  scroll: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, gap: spacing.md, ...shadows.card,
  },
  sectionTitle: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  field: { gap: 4 },
  label: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: spacing.md,
    color: colors.navy, fontSize: fontSize.body, fontFamily: 'Nunito-Regular',
    backgroundColor: colors.white,
  },
  inputDisabled: { backgroundColor: colors.lightGray, color: colors.gray },
  hint: { fontSize: fontSize.micro, color: colors.gray, fontFamily: 'Nunito-Regular' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 14,
    marginTop: spacing.xs,
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold' },
})
