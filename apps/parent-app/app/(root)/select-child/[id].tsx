import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useChildren } from '@/hooks/useChildren'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'
import { ActivitySummaryBar } from '@/components/booking/ActivitySummaryBar'
import { BookingWizardHeader } from '@/components/booking/BookingWizardHeader'
import {
  AGE_BANDS,
  MAIN_BOOKING_STEP_LABELS,
  deriveDobFromAgeBand,
  getBookingTypeLabel,
  type AgeBandId,
} from '@/lib/booking-flow'

export default function SelectChildScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { parentUserId } = useAuth()
  const {
    id,
    bookingType,
    bookingTypeLabel,
    teacherId,
    teacherName,
    slotId,
    date,
    time,
    duration,
    price,
    flowId,
  } = useLocalSearchParams<{
    id: string
    bookingType?: string
    bookingTypeLabel?: string
    teacherId?: string
    teacherName?: string
    slotId: string
    date: string
    time: string
    duration?: string
    price?: string
    flowId?: string
  }>()
  const { data: activity } = useActivity(id ?? null)
  const { data: childrenData, isLoading } = useChildren()

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [saving, setSaving] = useState(false)
  const [childName, setChildName] = useState('')
  const [ageBand, setAgeBand] = useState<AgeBandId>('5-7')
  const [gender, setGender] = useState<string | null>(null)

  const children = childrenData?.items ?? []
  const bookingLabel = bookingTypeLabel ?? getBookingTypeLabel(bookingType)
  const parsedPrice = price ? parseFloat(price) : activity ? parseFloat(activity.pricePerSession) : 0
  const durationMins = duration ? Number(duration) : activity?.sessionDurationMins

  useEffect(() => {
    setSelectedChildId(null)
    setShowAddChild(false)
    setSaving(false)
    setChildName('')
    setAgeBand('5-7')
    setGender(null)
  }, [flowId, id, slotId, date, time, bookingType, teacherId])

  useEffect(() => {
    if (children.length === 0) {
      setShowAddChild(true)
      setSelectedChildId(null)
      return
    }

    if (!selectedChildId || !children.some((child) => child.id === selectedChildId)) {
      setSelectedChildId(children[0]?.id ?? null)
    }
  }, [children, selectedChildId])

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  )

  async function handleCreateChild() {
    if (!parentUserId) return
    if (childName.trim().length < 2) {
      Alert.alert('Add child name', 'Enter at least 2 characters so we can save this child profile.')
      return
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSaving(true)
    try {
      const child = await parentApi.children.create({
        parentId: parentUserId,
        firstName: childName.trim(),
        dateOfBirth: deriveDobFromAgeBand(ageBand),
        gender: gender ?? undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      setSelectedChildId(child.id)
      setShowAddChild(false)
      setChildName('')
      setGender(null)
    } catch (err: any) {
      Alert.alert('Could not add child', err?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleContinue() {
    if (!selectedChild?.id || !id) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push({
      pathname: '/(root)/review-booking/[id]',
      params: {
        id,
        bookingType: bookingType ?? '',
        bookingTypeLabel: bookingLabel,
        teacherId: teacherId ?? '',
        teacherName: teacherName ?? '',
        slotId,
        date,
        time,
        duration: durationMins ? String(durationMins) : '',
        price: String(parsedPrice),
        childId: selectedChild.id,
        flowId: flowId ?? '',
      },
    })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BookingWizardHeader
        step={3}
        totalSteps={MAIN_BOOKING_STEP_LABELS.length}
        stepLabels={MAIN_BOOKING_STEP_LABELS}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 132 }}>
        <ActivitySummaryBar
          title={activity?.title ?? '—'}
          teacherName={teacherName ?? null}
          durationMins={durationMins}
          deliveryMode={activity?.deliveryMode}
          price={parsedPrice}
          imageUrl={activity?.imageUrl}
        />

        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Select or add child</Text>
          <Text style={styles.headerText}>
            {bookingLabel} is almost ready. Pick the child for this slot or add a new one with just name and age band.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your children</Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setShowAddChild((prev) => !prev)
              }}
            >
              <Ionicons name={showAddChild ? 'remove-circle-outline' : 'add-circle-outline'} size={16} color={colors.primary} />
              <Text style={styles.linkText}>{showAddChild ? 'Hide form' : 'Add child'}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : children.length === 0 && !showAddChild ? (
            <Text style={styles.emptyText}>No child profiles yet. Add one below to continue.</Text>
          ) : (
            children.map((child) => {
              const active = child.id === selectedChildId
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childRow, active && styles.childRowActive]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setSelectedChildId(child.id)
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>{child.firstName[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{child.firstName}</Text>
                    <Text style={styles.childMeta}>
                      {child.dateOfBirth ? `${getAge(child.dateOfBirth)} yrs` : 'Age not set'}
                      {child.gender ? ` · ${child.gender}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        {showAddChild ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quick add child</Text>
            <TextInput
              style={styles.input}
              placeholder="Child first name"
              placeholderTextColor={colors.gray}
              value={childName}
              onChangeText={setChildName}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Age band</Text>
              <View style={styles.chipRow}>
                {AGE_BANDS.map((band) => {
                  const active = band.id === ageBand
                  return (
                    <TouchableOpacity
                      key={band.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setAgeBand(band.id)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{band.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.chipRow}>
                {['Boy', 'Girl', 'Prefer not to say'].map((option) => {
                  const active = option === gender
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setGender(active ? null : option)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.secondaryBtn, saving && styles.secondaryBtnDisabled]}
              onPress={handleCreateChild}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>{saving ? 'Saving…' : 'Save child'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, !selectedChildId && styles.ctaBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedChildId}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Review booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function getAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  return today.getFullYear() - birth.getFullYear()
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },
  headerCard: {
    backgroundColor: colors.mint,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  headerTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.primary },
  headerText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.primary, lineHeight: 20 },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  linkText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
  emptyText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  childRowActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  childAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
  childName: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  childMeta: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  input: {
    height: 50,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.lightGray,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
  },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  chipText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  chipTextActive: { color: colors.primary },
  secondaryBtn: {
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDisabled: { opacity: 0.7 },
  secondaryBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  bottomBar: {
    backgroundColor: '#F6F4EF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  ctaBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
})
