import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { useActivity } from '@/hooks/useActivities'
import { useSlots } from '@/hooks/useSlots'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useSavedActivities } from '@/lib/SavedActivitiesContext'
import { useAuth } from '@/lib/AuthContext'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Avatar'
import type { ActivityTeacher } from '@/lib/api'
import { buildBookingCta } from '@/lib/booking-flow'

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
  const { user } = useAuth()
  const { state } = useLateOnboarding()
  const { data: activity, isLoading, isError, refetch: refetchActivity } = useActivity(id ?? null)
  const { isWishlisted, toggleWishlist, markViewed } = useSavedActivities()
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState(0)
  const bookingWindowStart = new Date().toISOString().slice(0, 10)
  const selectedTeacher = activity?.teachers?.[selectedTeacherIndex] ?? null
  const { data: slotsData } = useSlots(id ?? null, bookingWindowStart, 7, selectedTeacher?.id ?? null)
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetchActivity()
  })

  useEffect(() => {
    if (!activity?.teachers?.length) {
      if (selectedTeacherIndex !== 0) setSelectedTeacherIndex(0)
      return
    }

    if (selectedTeacherIndex > activity.teachers.length - 1) {
      setSelectedTeacherIndex(0)
    }
  }, [activity?.teachers, selectedTeacherIndex])

  useEffect(() => {
    if (!activity) return
    void markViewed({
      id: activity.id,
      title: activity.title,
      imageUrl: activity.imageUrl,
      pricePerSession: activity.pricePerSession,
      ageGroup: activity.ageGroup,
      categoryName: activity.categoryName,
      sessionDurationMins: activity.sessionDurationMins,
      avgRating: activity.avgRating,
    })
  }, [activity, markViewed])

  const handleBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const selectedTeacher = activity?.teachers?.[selectedTeacherIndex] ?? null
    router.push({
      pathname: `/(root)/choose-booking/${id}`,
      params: {
        teacherId: selectedTeacher?.id ?? '',
        teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName ?? ''}`.trim() : '',
      },
    })
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
  const priceValue = parseFloat(activity.pricePerSession)
  const price = priceValue.toFixed(0)
  const isAtHome = activity.deliveryMode === 'at_home'
  const teachers = activity.teachers ?? []
  const liked = isWishlisted(activity.id)
  const cityLabel =
    selectedTeacher?.city ??
    (user?.user_metadata?.city as string | undefined) ??
    state.city ??
    'Your area'
  const nextAvailableSlot =
    Object.values(slotsData?.slots ?? {})
      .flat()
      .filter((slot) => slot.isAvailable)
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())[0] ?? null
  const nextSlotLabel = nextAvailableSlot
    ? formatSlotLabel(nextAvailableSlot.date, nextAvailableSlot.startTime)
    : 'Slots update after you choose a teacher'
  const activityFormat = inferActivityFormat(activity.title, activity.tags, activity.sessionType)
  const parentValuePoints = buildParentValuePoints(activity)
  const timelineSteps = buildTimeline(activity)
  const policyPoints = buildPolicyPoints(activity, isAtHome)
  const venueFacts = buildVenueFacts({
    teacher: selectedTeacher,
    cityLabel,
    isAtHome,
    activityFormat,
    activity,
  })

  // Derive "learns" items from preparationNotes or fall back to tags
  const learnsItems: string[] = activity.preparationNotes
    ? activity.preparationNotes.split('\n').filter(Boolean).slice(0, 5)
    : (activity.tags ?? []).slice(0, 4)

  const materialsItems: string[] = activity.materialsNeeded
    ? activity.materialsNeeded.split('\n').filter(Boolean)
    : []

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

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
                await toggleWishlist({
                  id: activity.id,
                  title: activity.title,
                  imageUrl: activity.imageUrl,
                  pricePerSession: activity.pricePerSession,
                  ageGroup: activity.ageGroup,
                  categoryName: activity.categoryName,
                  sessionDurationMins: activity.sessionDurationMins,
                  avgRating: activity.avgRating,
                })
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={colors.coral} />
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

          <View style={styles.aboveFoldCard}>
            <DetailFact icon="people-outline" label="Age range" value={activity.ageGroup} />
            <DetailFact icon="location-outline" label="Location" value={`${isAtHome ? 'At home' : 'Online'} · ${cityLabel}`} />
            <DetailFact icon="calendar-outline" label="Next available" value={nextSlotLabel} />
            <DetailFact icon="repeat-outline" label="Format" value={activityFormat} />
          </View>

          <View style={styles.highlightsRow}>
            <HighlightBadge label={teachers.length > 0 ? 'Verified facilitator' : 'Teacher assigned at booking'} />
            <HighlightBadge label={materialsItems.length > 0 ? 'Materials guidance included' : 'Simple setup'} />
            <HighlightBadge label={activity.reviewCount > 0 ? `${activity.reviewCount} parent reviews` : 'New on Beam'} />
          </View>

          <SectionHeading>Why this activity</SectionHeading>
          <Text style={styles.description}>{activity.description}</Text>
          <View style={styles.infoPanel}>
            {parentValuePoints.map((item) => (
              <BulletRow key={item} text={item} />
            ))}
          </View>

          <SectionHeading>What happens</SectionHeading>
          <View style={styles.learnsBox}>
            <View style={styles.learnsHeader}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.learnsTitle}>Session timeline</Text>
            </View>
            {timelineSteps.map((item) => (
              <View key={item} style={styles.learnRow}>
                <View style={styles.learnDot} />
                <Text style={styles.learnText}>{item}</Text>
              </View>
            ))}
          </View>

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

          <SectionHeading>Leader & venue</SectionHeading>
          <TeacherCard
            teachers={teachers}
            selectedIndex={selectedTeacherIndex}
            onChangeIndex={setSelectedTeacherIndex}
          />
          <View style={styles.infoPanel}>
            {venueFacts.map((item) => (
              <BulletRow key={item} text={item} />
            ))}
          </View>

          <SectionHeading>Policies</SectionHeading>
          <View style={styles.infoPanel}>
            {policyPoints.map((item) => (
              <BulletRow key={item} text={item} />
            ))}
          </View>
          {materialsItems.length > 0 && (
            <>
              <View style={styles.materialsHeadingRow}>
                <Ionicons name="gift-outline" size={18} color={colors.yellow} />
                <Text style={[styles.sectionHeading, { marginBottom: 0, marginTop: 0 }]}>What to bring</Text>
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
        <Button
          label={buildBookingCta(activity.trialAvailable ? 'trial_session' : 'single_session', priceValue)}
          variant="primary"
          fullWidth={false}
          onPress={handleBook}
          disabled={teachers.length === 0}
        />
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

function DetailFact({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.detailFact}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailFactLabel}>{label}</Text>
        <Text style={styles.detailFactValue}>{value}</Text>
      </View>
    </View>
  )
}

function HighlightBadge({ label }: { label: string }) {
  return (
    <View style={styles.highlightBadge}>
      <Text style={styles.highlightBadgeText}>{label}</Text>
    </View>
  )
}

function BulletRow({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function TeacherCard({
  teachers,
  selectedIndex,
  onChangeIndex,
}: {
  teachers: ActivityTeacher[]
  selectedIndex: number
  onChangeIndex: (index: number) => void
}) {
  if (teachers.length === 0) {
    return (
      <View style={styles.teacherCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.teacherName}>No teacher assigned yet</Text>
          <Text style={styles.teacherBio}>Slots will appear once a teacher is assigned to this activity.</Text>
        </View>
      </View>
    )
  }

  const teacher = teachers[selectedIndex] ?? teachers[0]
  if (!teacher) {
    return (
      <View style={styles.teacherCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.teacherName}>No teacher assigned yet</Text>
        </View>
      </View>
    )
  }

  const yearsExp = teacher.totalSessions > 0
    ? `${Math.max(1, Math.floor(teacher.totalSessions / 20))} years experience`
    : null
  const teacherCountLabel = `${selectedIndex + 1}/${teachers.length}`
  const specializations = teacher.specializations.slice(0, 2).join(' · ')

  return (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeaderRow}>
        <View style={styles.teacherProfileRow}>
          <View>
            <Avatar firstName={teacher.firstName} lastName={teacher.lastName ?? undefined} size={52} colorIndex={0} />
            {teacher.verificationStatus === 'verified' && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.teacherName}>{teacher.firstName} {teacher.lastName ?? ''}</Text>
            <Text style={styles.teacherMeta}>
              {[yearsExp, teacher.verificationStatus === 'verified' ? 'Verified' : null].filter(Boolean).join(' · ')}
            </Text>
            {!!specializations && <Text style={styles.teacherMeta}>{specializations}</Text>}
          </View>
        </View>
        <View style={styles.teacherPager}>
          <TouchableOpacity
            style={[styles.teacherArrow, selectedIndex === 0 && styles.teacherArrowDisabled]}
            onPress={() => onChangeIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
          >
            <Ionicons name="chevron-back" size={16} color={selectedIndex === 0 ? colors.border : colors.navy} />
          </TouchableOpacity>
          <Text style={styles.teacherCountText}>{teacherCountLabel}</Text>
          <TouchableOpacity
            style={[styles.teacherArrow, selectedIndex === teachers.length - 1 && styles.teacherArrowDisabled]}
            onPress={() => onChangeIndex(Math.min(teachers.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === teachers.length - 1}
          >
            <Ionicons name="chevron-forward" size={16} color={selectedIndex === teachers.length - 1 ? colors.border : colors.navy} />
          </TouchableOpacity>
        </View>
      </View>
      {teacher.bio ? (
        <Text style={styles.teacherBio} numberOfLines={4}>{teacher.bio}</Text>
      ) : (
        <Text style={styles.teacherBio}>No description available yet.</Text>
      )}
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

function formatSlotLabel(date: string, startTime: string) {
  const slotDate = new Date(`${date}T${startTime}`)
  const today = new Date()
  const isToday = slotDate.toDateString() === today.toDateString()
  const dayLabel = isToday
    ? 'Today'
    : slotDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = slotDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${dayLabel} · ${timeLabel}`
}

function inferActivityFormat(title: string, tags: string[], sessionType: string) {
  const haystack = `${title} ${tags.join(' ')}`.toLowerCase()
  if (haystack.includes('trial')) return 'Trial available'
  if (haystack.includes('weekly') || haystack.includes('course') || haystack.includes('recurring') || sessionType === 'group') {
    return 'Recurring-friendly'
  }
  return 'One-time session'
}

function buildParentValuePoints(activity: {
  title: string
  ageGroup: string
  sessionDurationMins: number
  tags: string[]
  totalBookings: number
  reviewCount: number
}) {
  const values = [
    `Designed for children in the ${activity.ageGroup} range, with a pace that feels engaging rather than school-like.`,
    `A focused ${activity.sessionDurationMins}-minute format keeps the session structured without overwhelming your child.`,
    activity.reviewCount > 0
      ? `Backed by ${activity.reviewCount} parent reviews so you can gauge fit before you book.`
      : 'A clear session structure helps you understand the fit before committing.',
  ]

  if (activity.tags.length > 0) {
    values.push(`Built around ${activity.tags.slice(0, 3).join(', ').toLowerCase()} to keep the session purposeful.`)
  } else if (activity.totalBookings > 0) {
    values.push(`Chosen by ${activity.totalBookings} families already, which helps signal parent trust.`)
  }

  return values
}

function buildTimeline(activity: {
  preparationNotes: string | null
  tags: string[]
}) {
  const noteSteps = activity.preparationNotes
    ? activity.preparationNotes.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 4)
    : []

  if (noteSteps.length > 0) {
    return noteSteps
  }

  return [
    'Warm welcome and a quick check-in to help your child settle.',
    `Guided activity time centered on ${activity.tags.slice(0, 2).join(' and ').toLowerCase() || 'hands-on exploration'}.`,
    'Creation or practice time with teacher support and encouragement.',
    'Short wrap-up with handover and clear next-step guidance for parents.',
  ]
}

function buildVenueFacts({
  teacher,
  cityLabel,
  isAtHome,
  activityFormat,
  activity,
}: {
  teacher: ActivityTeacher | null
  cityLabel: string
  isAtHome: boolean
  activityFormat: string
  activity: { sessionType: string; totalBookings: number }
}) {
  const facts = [
    teacher?.verificationStatus === 'verified'
      ? 'Beam-verified facilitator with profile checks completed.'
      : 'Teacher assignment is confirmed before booking is finalised.',
    `${isAtHome ? 'At-home setup' : 'Online delivery'} in ${cityLabel}, so parents know how the session will run.`,
    activity.sessionType === 'group'
      ? 'Small-group format helps children learn alongside peers while keeping facilitation guided.'
      : 'Smaller-format delivery keeps the experience more personalised for your child.',
    `${activityFormat} format, useful if you want to test fit before committing longer term.`,
  ]

  if (teacher?.specializations?.length) {
    facts.push(`Teacher strengths include ${teacher.specializations.slice(0, 3).join(', ').toLowerCase()}.`)
  }

  if (activity.totalBookings > 0) {
    facts.push(`${activity.totalBookings} completed family bookings help signal continuity and trust.`)
  }

  return facts
}

function buildPolicyPoints(activity: { materialsNeeded: string | null }, isAtHome: boolean) {
  return [
    activity.materialsNeeded
      ? 'Materials guidance is shared upfront so parents know what is included and what to keep ready.'
      : 'Setup is designed to stay simple, with minimal prep required from parents.',
    'Rescheduling and cancellation terms should be checked before payment so there are no surprises later.',
    `${isAtHome ? 'A parent should be reachable during the at-home session for handover and comfort.' : 'Keep a quiet, child-ready setup available for the session window.'}`,
    'Accessibility, comfort needs, or child-specific notes can be reviewed before confirming the booking.',
  ]
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
  aboveFoldCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailFact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailFactLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
  },
  detailFactValue: {
    marginTop: 2,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    lineHeight: 20,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  highlightBadge: {
    backgroundColor: colors.mint,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  highlightBadgeText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },

  // Teacher card
  teacherCard: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  teacherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teacherProfileRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  teacherPager: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teacherArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
  teacherArrowDisabled: {
    backgroundColor: colors.white,
  },
  teacherCountText: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
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
  infoPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
    lineHeight: 22,
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
