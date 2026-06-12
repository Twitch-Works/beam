import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize } from '@/constants/theme'
import { useTeacher } from '@/hooks/useTeacher'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Avatar } from '@/components/Avatar'
import { TeacherSkeleton } from '@/components/teacher/TeacherSkeleton'
import { TeacherClassCard } from '@/components/teacher/TeacherClassCard'

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: teacher, isLoading, isError } = useTeacher(id ?? null)
  const [activeTab, setActiveTab] = useState<'about' | 'classes' | 'reviews'>('about')

  const handleBookActivity = async (activityId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/(root)/slots/${activityId}`)
  }

  const fullName = teacher ? `${teacher.firstName} ${teacher.lastName ?? ''}`.trim() : ''

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Teacher Profile" onBack={() => router.back()} />

      {isLoading ? (
        <TeacherSkeleton />
      ) : isError || !teacher ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Couldn't load teacher profile</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.profileHero}>
            <View style={styles.avatarRing}>
              <Avatar firstName={teacher.firstName} lastName={teacher.lastName} size={88} colorIndex={0} />
              {teacher.verificationStatus === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.white} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{teacher.totalSessions}</Text><Text style={styles.statLabel}>Sessions</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>{teacher.activities.length}</Text><Text style={styles.statLabel}>Activities</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>{teacher.city ?? '—'}</Text><Text style={styles.statLabel}>City</Text></View>
            </View>
            {teacher.specializations.length > 0 && (
              <View style={styles.specialtyRow}>
                {teacher.specializations.slice(0, 3).map((s) => (
                  <View key={s} style={styles.specialtyPill}><Text style={styles.specialtyText}>{s}</Text></View>
                ))}
                {teacher.specializations.length > 3 && (
                  <View style={styles.specialtyPill}><Text style={styles.specialtyText}>+{teacher.specializations.length - 3}</Text></View>
                )}
              </View>
            )}
          </View>

          <View style={styles.tabRow}>
            {(['about', 'classes', 'reviews'] as const).map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'about' && (
              <Text style={[styles.bio, !teacher.bio && { color: colors.gray }]}>
                {teacher.bio || 'No bio available yet.'}
              </Text>
            )}

            {activeTab === 'classes' && (
              <View style={{ gap: spacing.md }}>
                {teacher.activities.length === 0 ? (
                  <Text style={{ color: colors.gray, fontFamily: 'Nunito-Regular', fontSize: fontSize.body }}>
                    No active classes at the moment.
                  </Text>
                ) : (
                  teacher.activities.map((act) => (
                    <TeacherClassCard key={act.id} activity={act} onBook={() => handleBookActivity(act.id)} />
                  ))
                )}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.emptyReviews}>
                <Ionicons name="star-outline" size={40} color={colors.border} />
                <Text style={styles.emptyReviewsText}>Reviews coming soon</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  backLink: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  profileHero: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  avatarRing: { position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: radius.avatar, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  name: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightGray, borderRadius: radius.card, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, width: '100%' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.navy },
  statLabel: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.gray },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  specialtyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  specialtyPill: { backgroundColor: colors.mint, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.avatar },
  specialtyText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
  tabBtnTextActive: { color: colors.primary, fontFamily: 'Nunito-Bold' },
  tabContent: { padding: spacing.md, gap: spacing.md },
  bio: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 26 },
  emptyReviews: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyReviewsText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
})
