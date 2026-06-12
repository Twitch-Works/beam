import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTeacherProfile, useUpdateProfile } from '../../../src/hooks/useTeacherProfile'
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/constants/theme'

const ALL_LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati']

export default function ProfileEditScreen() {
  const { data } = useTeacherProfile()
  const updateProfile = useUpdateProfile()

  const [firstName, setFirstName] = React.useState(data?.teacher.firstName ?? '')
  const [lastName,  setLastName]  = React.useState(data?.teacher.lastName  ?? '')
  const [city,      setCity]      = React.useState(data?.city              ?? '')
  const [bio,       setBio]       = React.useState(data?.teacher.bio       ?? '')
  const [languages, setLanguages] = React.useState<string[]>(data?.languages ?? [])

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const canSave = firstName.trim() && lastName.trim() && city.trim() && !updateProfile.isPending

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ firstName, lastName, city, bio, specializations: languages })
      router.back()
    } catch {
      // error state shown via updateProfile.isError
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Info</Text>

          <View style={styles.fieldRow}>
            <View style={[styles.field, styles.fieldFlex]}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.gray}
              />
            </View>
            <View style={[styles.field, styles.fieldFlex]}>
              <Text style={styles.fieldLabel}>Last name</Text>
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
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Bengaluru"
              placeholderTextColor={colors.gray}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell parents and children a bit about yourself…"
              placeholderTextColor={colors.gray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.sectionSub}>Select all languages you can teach in</Text>
          <View style={styles.chips}>
            {ALL_LANGUAGES.map((lang) => {
              const active = languages.includes(lang)
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => toggleLanguage(lang)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {updateProfile.isError && (
          <Text style={styles.errorText}>Failed to save. Please try again.</Text>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>{updateProfile.isPending ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  headerSpacer: { width: 36 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, gap: spacing.md,
  },
  sectionTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  sectionSub: { color: colors.gray, fontSize: fontSize.caption, marginTop: -spacing.sm },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  field: { gap: 4 },
  fieldFlex: { flex: 1 },
  fieldLabel: { color: colors.navy, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.input, paddingHorizontal: spacing.md,
    color: colors.navy, fontSize: fontSize.body,
    backgroundColor: colors.white,
  },
  bioInput: { height: 100, paddingTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  chipText: { color: colors.navy, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  chipTextActive: { color: colors.primary },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 14,
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  errorText: { color: colors.error, fontSize: fontSize.caption, textAlign: 'center' },
})
