import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useChildren } from '@/hooks/useChildren'
import { useBookings } from '@/hooks/useBookings'
import { useActivities } from '@/hooks/useActivities'
import { useChildProgress } from '@/hooks/useChildProgress'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { Avatar } from '@/components/Avatar'
import { ChildSelector } from '@/components/kids/ChildSelector'
import type { Child } from '@/lib/api'

const LEVELS = ['Level 1 Starter', 'Level 2 Learner', 'Level 3 Achiever', 'Level 4 Explorer', 'Level 5 Champion']

function skillLabel(score: number): string {
  if (score >= 80) return 'Advanced'
  if (score >= 60) return 'Intermediate'
  if (score >= 40) return 'Improving'
  return 'Beginner'
}

export default function KidsScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useChildren()
  const children: Child[] = data?.items ?? []
  const { data: activitiesData } = useActivities({ limit: 4 })
  const recommendedActivities = activitiesData?.items?.slice(0, 4) ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedChild = useMemo(() => {
    if (selectedId) return children.find(c => c.id === selectedId) ?? children[0] ?? null
    return children[0] ?? null
  }, [selectedId, children])

  const { data: progress } = useChildProgress(selectedChild?.id)

  const sessionsForChild = progress?.totalSessions ?? 0
  const level = LEVELS[Math.min(Math.floor(sessionsForChild / 2), LEVELS.length - 1)]

  const skillsDisplay = progress ? [
    { key: 'CREATIVITY', value: skillLabel(progress.skills.creativity) },
    { key: 'FOCUS',      value: skillLabel(progress.skills.focus) },
  ] : [
    { key: 'CREATIVITY', value: '—' },
    { key: 'FOCUS',      value: '—' },
  ]

  const badges = progress?.badges ?? []
  const teacherNote = progress?.teacherNote ?? null

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kids Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track growth & milestones</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push('/(auth)/child-setup')
          }}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <KidsSkeleton bottomInset={insets.bottom} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* ── Child selector ── */}
          <ChildSelector
            children={children}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {!selectedChild ? (
            <EmptyState title="Add your first child" subtitle="Tap + to get started" />
          ) : (
            <>
              {/* ── Progress Card ── */}
              <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                {/* Card header */}
                <View style={styles.progressHeader}>
                  <View style={styles.progressHeaderLeft}>
                    <View style={styles.progressStarWrap}>
                      <Ionicons name="star" size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.progressName}>{selectedChild.firstName}'s Progress</Text>
                      <Text style={styles.progressLevel}>{level.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <TouchableOpacity
                      style={styles.detailsLink}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push({
                          pathname: '/(root)/child/edit',
                          params: {
                            id: selectedChild!.id,
                            firstName: selectedChild!.firstName,
                            lastName: selectedChild!.lastName ?? '',
                            dob: selectedChild!.dateOfBirth,
                          },
                        })
                      }}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailsLink}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push({
                          pathname: '/(root)/child/[id]',
                          params: { id: selectedChild!.id, name: selectedChild!.firstName, dob: selectedChild!.dateOfBirth },
                        })
                      }}
                    >
                      <Text style={styles.detailsText}>Details</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Skills row */}
                <View style={styles.skillsRow}>
                  {skillsDisplay.map((s, i) => (
                    <View key={s.key} style={[styles.skillCol, i > 0 && styles.skillColBorder]}>
                      <Text style={styles.skillKey}>{s.key}</Text>
                      <Text style={styles.skillVal}>{s.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Stats footer — dark teal */}
                <View style={styles.statsBand}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{sessionsForChild}</Text>
                    <Text style={styles.statLabel}>SESSIONS</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.streakRow}>
                      <Ionicons name="flame" size={16} color="#FCD34D" />
                      <Text style={styles.statNumber}>2wk</Text>
                    </View>
                    <Text style={styles.statLabel}>STREAK</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.radarBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      router.push({
                        pathname: '/(root)/child/[id]',
                        params: {
                          id: selectedChild?.id ?? '',
                          name: selectedChild?.firstName ?? '',
                          dob: selectedChild?.dateOfBirth ?? '',
                        },
                      })
                    }}
                  >
                    <Text style={styles.radarText}>View Radar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Latest Teacher Note ── */}
              {teacherNote && (
                <View style={styles.card}>
                  <View style={styles.noteHeader}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={styles.cardTitle}>Latest Teacher Note</Text>
                  </View>
                  <View style={styles.noteRow}>
                    <Avatar firstName={teacherNote.teacherName.split(' ')[0] ?? '?'} size={40} colorIndex={0} />
                    <View style={styles.noteInfo}>
                      <Text style={styles.noteTeacher}>{teacherNote.teacherName}</Text>
                    </View>
                    <Text style={styles.noteDate}>{teacherNote.date}</Text>
                  </View>
                  <Text style={styles.noteText}>"{teacherNote.note}"</Text>
                </View>
              )}

              {/* ── Latest Achievements ── */}
              {badges.length > 0 && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Latest Achievements</Text>
                    <View style={styles.totalBadge}>
                      <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
                      <Text style={styles.totalText}>{badges.length} total</Text>
                    </View>
                  </View>
                  <View style={styles.badgesRow}>
                    {badges.map((badge) => (
                      <View key={badge.id} style={styles.badgeCard}>
                        <View style={[styles.badgeIconWrap, { backgroundColor: badge.bg }]}>
                          <Ionicons name={badge.icon as any} size={22} color={badge.iconColor} />
                        </View>
                        <Text style={styles.badgeLabel}>{badge.label.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* ── Recommended for child ── */}
              {recommendedActivities.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.md, marginTop: spacing.xl }]}>
                    Recommended for {selectedChild.firstName}
                  </Text>
                  <View style={styles.recommendedGrid}>
                    {recommendedActivities.slice(0, 4).map((activity) => (
                      <TouchableOpacity
                        key={activity.id}
                        style={styles.recCard}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          router.push(`/(root)/activity/${activity.id}`)
                        }}
                        activeOpacity={0.88}
                      >
                        <Image
                          source={activity.imageUrl ? { uri: activity.imageUrl } : require('../../assets/images/icon.png')}
                          style={styles.recImage}
                          contentFit="cover"
                        />
                        <View style={styles.recBody}>
                          {activity.tags?.[0] && (
                            <View style={styles.recTag}>
                              <Text style={styles.recTagText}>{activity.tags[0].toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={styles.recTitle} numberOfLines={2}>{activity.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────

function KidsSkeleton({ bottomInset }: { bottomInset: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: spacing.sm }}>
            <Skeleton width={68} height={68} radius={34} />
            <Skeleton width={44} height={13} />
          </View>
        ))}
      </View>
      <View style={[styles.card, { gap: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Skeleton width={36} height={36} radius={18} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton width={60} height={16} />
        </View>
        <Skeleton width="100%" height={56} radius={radius.card} />
        <Skeleton width="100%" height={70} radius={radius.card} />
      </View>
      <View style={[styles.card, { gap: spacing.md }]}>
        <Skeleton width="50%" height={18} />
        <Skeleton width="100%" height={80} radius={radius.card} />
      </View>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy },
  headerSubtitle: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },

  scroll: { gap: spacing.lg, paddingTop: spacing.lg },

  // Card base
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },

  // Progress card
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressStarWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  progressName: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  progressLevel: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray, marginTop: 1 },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },

  skillsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  skillCol: { flex: 1, padding: spacing.md, gap: 4 },
  skillColBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  skillKey: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.gray, letterSpacing: 0.5 },
  skillVal: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },

  statsBand: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.white },
  statLabel: { fontSize: fontSize.micro, fontFamily: 'Nunito-SemiBold', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: spacing.sm },
  radarBtn: {
    marginLeft: 'auto' as any,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  radarText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.white },

  // Teacher note
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noteInfo: { flex: 1 },
  noteTeacher: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  noteDate: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  noteText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Achievements
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  sectionTitle: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.navy },
  totalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },

  badgesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  badgeIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: fontSize.micro,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Recommended grid
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  recImage: { width: '100%', height: 110 },
  recBody: { padding: spacing.sm, gap: spacing.xs },
  recTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mint,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  recTagText: {
    fontSize: fontSize.micro,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  recTitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    lineHeight: 18,
  },
})
