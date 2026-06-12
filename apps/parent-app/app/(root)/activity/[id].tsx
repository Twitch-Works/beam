import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useTeacher } from '@/hooks/useTeacher'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Avatar'

const { width } = Dimensions.get('window')
const HERO_HEIGHT = 280

const STATIC_FAQS = [
  { q: 'What if I need to reschedule?', a: 'You can reschedule up to 4 hours before the session at no charge.' },
  { q: 'Is the teacher background verified?', a: 'Yes, all Beam teachers are ID verified and background checked before onboarding.' },
  { q: "What if my child doesn't enjoy the session?", a: 'We offer a full refund if you raise a concern within 24 hours of the session.' },
]

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: activity, isLoading, isError } = useActivity(id ?? null)
  const { data: teacher, isLoading: teacherLoading } = useTeacher(activity?.teacherId ?? null)
  const [isLiked, setIsLiked] = useState(false)

  const handleBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/(root)/slots/${id}`)
  }

  if (isLoading) return <LoadingSkeleton insetTop={insets.top} />

  if (isError || !activity) {
    return (
      <View style={[styles.container, styles.errorState, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={48} color={colors.border} style={{ marginTop: spacing.xl }} />
        <Text style={styles.errorText}>Activity not found</Text>
      </View>
    )
  }

  const rating = activity.avgRating ? parseFloat(activity.avgRating) : null
  const price = parseFloat(activity.pricePerSession).toFixed(0)
  const isAtHome = activity.sessionType === 'home'

  // Derive "learns" items from preparationNotes or fall back to tags
  const learnsItems: string[] = activity.preparationNotes
    ? activity.preparationNotes.split('\n').filter(Boolean).slice(0, 5)
    : (activity.tags ?? []).slice(0, 4)

  const materialsItems: string[] = activity.materialsNeeded
    ? activity.materialsNeeded.split('\n').filter(Boolean)
    : []

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero ── */}
        <View style={styles.heroContainer}>
          <Image
            source={activity.imageUrl ? { uri: activity.imageUrl } : require('../../../assets/images/icon.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.38)', 'transparent', 'rgba(0,0,0,0.18)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back + Heart */}
          <View style={[styles.heroNav, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setIsLiked(v => !v)
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? colors.coral : colors.coral} />
            </TouchableOpacity>
          </View>

          {/* At Home badge */}
          {isAtHome && (
            <View style={styles.atHomeBadge}>
              <Ionicons name="home-outline" size={12} color={colors.navy} />
              <Text style={styles.atHomeBadgeText}>At Home</Text>
            </View>
          )}
        </View>

        {/* ── Content card ── */}
        <View style={styles.card}>

          {/* Category · Age */}
          <Text style={styles.categoryAge}>
            {[activity.categoryName, activity.ageGroup].filter(Boolean).join('  ·  ')}
          </Text>

          {/* Title */}
          <Text style={styles.title}>{activity.title}</Text>

          {/* Meta row: rating + duration + price */}
          <View style={styles.metaRow}>
            {rating !== null && (
              <View style={styles.metaChip}>
                <Ionicons name="star" size={14} color={colors.yellow} />
                <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
                <Text style={styles.metaSubText}>({activity.reviewCount})</Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={colors.gray} />
              <Text style={styles.metaText}>{activity.sessionDurationMins} min</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.priceInline}>₹{price}</Text>
          </View>

          {/* Teacher card */}
          <TeacherCard teacher={teacher} isLoading={teacherLoading} />

          {/* About */}
          <SectionHeading>About this activity</SectionHeading>
          <Text style={styles.description}>{activity.description}</Text>

          {/* What your child learns */}
          {learnsItems.length > 0 && (
            <View style={styles.learnsBox}>
              <View style={styles.learnsHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.learnsTitle}>What your child learns</Text>
              </View>
              {learnsItems.map((item) => (
                <View key={item} style={styles.learnRow}>
                  <View style={styles.learnDot} />
                  <Text style={styles.learnText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills developed */}
          {(activity.tags ?? []).length > 0 && (
            <>
              <SectionHeading>Skills developed</SectionHeading>
              <View style={styles.pillRow}>
                {(activity.tags ?? []).map((tag) => (
                  <View key={tag} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Materials needed */}
          {materialsItems.length > 0 && (
            <>
              <View style={styles.materialsHeadingRow}>
                <Ionicons name="gift-outline" size={18} color={colors.yellow} />
                <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>Materials needed</Text>
              </View>
              <View style={[styles.pillRow, { marginTop: spacing.sm }]}>
                {materialsItems.map((m) => (
                  <View key={m} style={styles.materialPill}>
                    <Text style={styles.materialPillText}>{m}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Parent Reviews */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionHeading}>Parent Reviews</Text>
            {rating !== null && (
              <View style={styles.metaChip}>
                <Ionicons name="star" size={14} color={colors.yellow} />
                <Text style={styles.reviewsRating}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <MockReviews />

          {/* FAQs */}
          <SectionHeading>FAQs</SectionHeading>
          {STATIC_FAQS.map((faq) => (
            <View key={faq.q} style={styles.faqItem}>
              <Text style={styles.faqQ}>Q: {faq.q}</Text>
              <Text style={styles.faqA}>A: {faq.a}</Text>
            </View>
          ))}

          {/* Bottom spacer for the sticky bar */}
          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View>
          <Text style={styles.priceLabel}>Per session</Text>
          <Text style={styles.priceLarge}>₹{price}</Text>
        </View>
        <Button label="Book Now" variant="primary" fullWidth={false} onPress={handleBook} />
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHeading}>{children}</Text>
}

function TeacherCard({ teacher, isLoading }: { teacher: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <View style={styles.teacherCard}>
        <Skeleton width={52} height={52} radius={radius.avatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="70%" height={12} />
          <Skeleton width="90%" height={12} />
        </View>
      </View>
    )
  }
  if (!teacher) return null

  const yearsExp = teacher.totalSessions > 0
    ? `${Math.max(1, Math.floor(teacher.totalSessions / 20))} years experience`
    : null

  return (
    <View style={styles.teacherCard}>
      <View>
        <Avatar firstName={teacher.firstName} lastName={teacher.lastName ?? undefined} size={52} colorIndex={0} />
        <View style={styles.verifiedDot}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.teacherName}>{teacher.firstName} {teacher.lastName ?? ''}</Text>
        <Text style={styles.teacherMeta}>
          {[yearsExp, 'Verified'].filter(Boolean).join(' · ')}
        </Text>
        {teacher.bio ? (
          <Text style={styles.teacherBio} numberOfLines={3}>{teacher.bio}</Text>
        ) : null}
      </View>
    </View>
  )
}

const MOCK_REVIEWS = [
  { name: 'Anita K.', ago: '2 weeks ago', stars: 5, text: 'Aarav absolutely loved it! The teacher was so patient and encouraging. Will definitely book again.' },
  { name: 'Rohan M.', ago: '1 month ago', stars: 5, text: 'Amazing session! My daughter came out glowing. The teacher was fantastic.' },
]

function MockReviews() {
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      {MOCK_REVIEWS.map((r) => (
        <View key={r.name} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Avatar firstName={r.name.split(' ')[0]} size={36} colorIndex={1} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{r.name}</Text>
              <Text style={styles.reviewAgo}>{r.ago}</Text>
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= r.stars ? 'star' : 'star-outline'} size={13} color={colors.yellow} />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>{r.text}</Text>
        </View>
      ))}
    </View>
  )
}

function LoadingSkeleton({ insetTop }: { insetTop: number }) {
  return (
    <View style={styles.container}>
      <Skeleton width={width} height={HERO_HEIGHT} radius={0} />
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <Skeleton width={140} height={16} radius={radius.badge} />
        <Skeleton width="80%" height={28} />
        <Skeleton width={200} height={18} radius={radius.badge} />
        <View style={styles.teacherCard}>
          <Skeleton width={52} height={52} radius={radius.avatar} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
        {[null, '90%', '70%', '85%'].map((w, i) => (
          <Skeleton key={i} width={(w ?? '100%') as any} height={14} />
        ))}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  errorState: { alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  errorText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },

  // Hero
  heroContainer: { position: 'relative', height: HERO_HEIGHT },
  heroImage: { width, height: HERO_HEIGHT },
  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  atHomeBadge: {
    position: 'absolute', bottom: spacing.md, left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm + 2, paddingVertical: 5,
    borderRadius: radius.button,
  },
  atHomeBadgeText: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.navy },

  // Card
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet,
    marginTop: -radius.sheet,
    paddingHorizontal: spacing.md, paddingTop: spacing.lg,
  },

  // Header info
  categoryAge: {
    fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.navy,
    lineHeight: 36, marginBottom: spacing.sm,
  },

  // Meta row
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  metaSubText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  priceInline: {
    fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.primary,
  },

  // Teacher card
  teacherCard: {
    flexDirection: 'row', gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: spacing.md,
    marginBottom: spacing.lg,
  },
  verifiedDot: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: colors.white, borderRadius: 8,
  },
  teacherName: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  teacherMeta: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: 2, marginBottom: 4 },
  teacherBio: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 20 },

  // Sections
  sectionHeading: {
    fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy,
    lineHeight: 24,
  },

  // Learns box
  learnsBox: {
    backgroundColor: colors.mint,
    borderRadius: radius.card, padding: spacing.md,
    gap: spacing.sm, marginTop: spacing.lg,
  },
  learnsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  learnsTitle: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  learnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 2 },
  learnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  learnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, flex: 1 },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillPill: {
    backgroundColor: colors.lavender + '28',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1,
    borderRadius: radius.badge,
  },
  skillPillText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: '#6B48D9' },
  materialsHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  materialPill: {
    backgroundColor: colors.yellow + '28',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1,
    borderRadius: radius.badge,
  },
  materialPillText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: '#7A4F00' },

  // Reviews
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  reviewsRating: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.navy },
  reviewCard: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: spacing.md, gap: spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewName: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy },
  reviewAgo: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  starsRow: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 22 },

  // FAQs
  faqItem: { marginBottom: spacing.md },
  faqQ: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy, marginBottom: 4 },
  faqA: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, lineHeight: 22 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadows.modal,
  },
  priceLabel: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  priceLarge: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.navy },
})
