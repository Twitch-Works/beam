import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Skeleton } from '@/components/Skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { InfoRow } from '@/components/InfoRow'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { parentApi } from '@/lib/api'
import type { Booking } from '@/lib/api'

function BookingDetailSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 32 }}>
      {/* Hero card */}
      <View style={{ backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card }}>
        <Skeleton width="100%" height={160} radius={0} />
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Skeleton width="60%" height={22} />
            <Skeleton width={72} height={22} radius={radius.badge} />
          </View>
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      {/* Session details card */}
      {[0, 1].map((ci) => (
        <View key={ci} style={{ backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.md, gap: spacing.md, ...shadows.card }}>
          <Skeleton width="45%" height={18} />
          {[0, 1, 2, 3].map((ri) => (
            <View key={ri} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Skeleton width={36} height={36} radius={radius.input} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Skeleton width="30%" height={11} />
                <Skeleton width="55%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Skeleton width="100%" height={48} radius={radius.button} />
    </ScrollView>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

type BookingPhase = 'upcoming' | 'today' | 'live' | 'completed' | 'cancelled'

function getBookingPhase(booking: Booking | null | undefined): BookingPhase {
  if (!booking) return 'upcoming'
  if (booking.status === 'cancelled') return 'cancelled'
  if (booking.status === 'completed') return 'completed'
  if (!booking.scheduledAt) return 'upcoming'

  const sessionStart = new Date(booking.scheduledAt)
  const now = new Date()
  const sameDay =
    sessionStart.getFullYear() === now.getFullYear() &&
    sessionStart.getMonth() === now.getMonth() &&
    sessionStart.getDate() === now.getDate()

  const liveStart = sessionStart.getTime() - 30 * 60 * 1000
  const liveEnd = sessionStart.getTime() + 2 * 60 * 60 * 1000

  if (now.getTime() >= liveStart && now.getTime() <= liveEnd) return 'live'
  if (sameDay) return 'today'
  return 'upcoming'
}

function getLocationLabel(booking: Booking | null | undefined) {
  if (!booking) return 'Your area'
  if (booking.deliveryMode === 'online') return 'Online session'
  return [booking.locality, booking.city].filter(Boolean).join(', ') || 'Your area'
}

type FeedbackChoice = 'loved_it' | 'okay' | 'not_really' | 'problem'

function getFeedbackChoiceMeta(choice: FeedbackChoice) {
  switch (choice) {
    case 'loved_it':
      return { rating: 5, label: 'Loved it', placeholder: 'What did your child enjoy most?' }
    case 'okay':
      return { rating: 3, label: 'It was okay', placeholder: 'Anything Beam should improve next time?' }
    case 'not_really':
      return { rating: 2, label: 'Not really', placeholder: 'Tell us what felt off so we can improve.' }
    case 'problem':
      return { rating: 1, label: 'There was a problem', placeholder: 'What went wrong?' }
  }
}

function isPositiveFeedback(rating?: number | null) {
  return (rating ?? 0) >= 4
}

type IssueCategoryKey =
  | 'cancel_reschedule'
  | 'leader_no_show'
  | 'venue_unavailable'
  | 'not_as_described'
  | 'safety_behaviour'
  | 'payment_refund'

const ISSUE_CATEGORY_CONFIG: Record<IssueCategoryKey, {
  label: string
  issueType: 'no_show' | 'venue_issue' | 'safety_issue' | 'schedule_issue' | 'other'
  desiredOutcome: 'refund' | 'credit' | 'rebooking' | 'support'
  questions: Array<{ id: string; label: string; placeholder: string }>
}> = {
  cancel_reschedule: {
    label: 'Cancel or reschedule',
    issueType: 'schedule_issue',
    desiredOutcome: 'rebooking',
    questions: [
      { id: 'timing_change', label: 'What changed?', placeholder: 'Plans changed, teacher timing changed, or cancellation issue…' },
      { id: 'preferred_help', label: 'What would help most?', placeholder: 'A new slot, refund guidance, or a callback…' },
    ],
  },
  leader_no_show: {
    label: 'Leader no-show',
    issueType: 'no_show',
    desiredOutcome: 'refund',
    questions: [
      { id: 'arrival_time', label: 'When were you at the venue or ready at home?', placeholder: 'Example: Ready by 10:55am for an 11am session' },
      { id: 'wait_time', label: 'How long did you wait?', placeholder: 'Example: Waited 25 minutes with no update' },
    ],
  },
  venue_unavailable: {
    label: 'Venue unavailable',
    issueType: 'venue_issue',
    desiredOutcome: 'support',
    questions: [
      { id: 'venue_problem', label: 'What happened at the venue?', placeholder: 'Closed, wrong address, not prepared, no access…' },
      { id: 'impact', label: 'How did this affect the session?', placeholder: 'Could not start, had to leave, unsafe environment…' },
    ],
  },
  not_as_described: {
    label: 'Not as described',
    issueType: 'other',
    desiredOutcome: 'credit',
    questions: [
      { id: 'difference', label: 'What felt different from what you booked?', placeholder: 'Age fit, format, materials, session quality…' },
      { id: 'child_response', label: 'How did your child react?', placeholder: 'Confused, bored, upset, or still engaged…' },
    ],
  },
  safety_behaviour: {
    label: 'Safety or behaviour',
    issueType: 'safety_issue',
    desiredOutcome: 'support',
    questions: [
      { id: 'safety_concern', label: 'What safety or behaviour issue happened?', placeholder: 'Unsafe setup, inappropriate behaviour, supervision concern…' },
      { id: 'immediate_risk', label: 'Is anyone still at risk right now?', placeholder: 'Share if immediate support is needed.' },
    ],
  },
  payment_refund: {
    label: 'Payment or refund',
    issueType: 'other',
    desiredOutcome: 'refund',
    questions: [
      { id: 'payment_issue', label: 'What payment problem are you seeing?', placeholder: 'Double charge, missing refund, failed payment after debit…' },
      { id: 'statement_reference', label: 'Any bank or app reference?', placeholder: 'Optional transaction reference or payment app note' },
    ],
  },
}

function getTrackerSteps(booking: Booking) {
  const resolved = booking.issueStatus === 'resolved'
  return [
    { key: 'submitted', label: 'Submitted', active: Boolean(booking.issueReportedAt) },
    { key: 'reviewing', label: 'Under review', active: booking.issueStatus === 'reviewing' || resolved },
    { key: 'resolution', label: 'Resolution', active: resolved || booking.issueResolution !== 'none' },
    { key: 'closed', label: 'Closed', active: resolved },
  ]
}

function formatSlaLabel(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  return `Expected by ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
}

function getIssueCategoryKeyFromBooking(booking: Booking | null | undefined): IssueCategoryKey {
  switch (booking?.issueType) {
    case 'no_show':
      return 'leader_no_show'
    case 'venue_issue':
      return 'venue_unavailable'
    case 'safety_issue':
      return 'safety_behaviour'
    case 'schedule_issue':
      return 'cancel_reschedule'
    default:
      if (booking?.status === 'cancelled' || booking?.status === 'rescheduled') return 'cancel_reschedule'
      if (booking?.status === 'completed') return 'not_as_described'
      if (booking?.paymentStatus === 'failed' || booking?.paymentStatus === 'refunded') return 'payment_refund'
      return 'leader_no_show'
  }
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { parentUserId } = useAuth()
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [issueNote, setIssueNote] = useState('')
  const [issueFormOpen, setIssueFormOpen] = useState(false)
  const [issueCategory, setIssueCategory] = useState<IssueCategoryKey>('leader_no_show')
  const [issueDesiredOutcome, setIssueDesiredOutcome] = useState<'refund' | 'credit' | 'rebooking' | 'support'>('support')
  const [issueAnswers, setIssueAnswers] = useState<Record<string, string>>({})
  const [issueAttachmentInput, setIssueAttachmentInput] = useState('')
  const [issueAttachments, setIssueAttachments] = useState<string[]>([])
  const [reportingIssue, setReportingIssue] = useState(false)
  const [feedbackChoice, setFeedbackChoice] = useState<FeedbackChoice | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const { data: booking, isLoading, isError, refetch } = useQuery<Booking>({
    queryKey: ['booking', id, parentUserId],
    queryFn: () => parentApi.bookings.get(id!, parentUserId!),
    enabled: !!id && !!parentUserId,
    staleTime: 1000 * 30,
  })
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetch()
  })

  const teacherName = booking?.teacherFirstName
    ? `${booking.teacherFirstName} ${booking.teacherLastName ?? ''}`.trim()
    : '—'
  const phase = getBookingPhase(booking)
  const locationLabel = getLocationLabel(booking)
  const childName = booking?.childFirstName ?? 'Your child'
  const feedbackMeta = feedbackChoice ? getFeedbackChoiceMeta(feedbackChoice) : null
  const effectiveRating = booking?.feedbackRating ?? (feedbackMeta?.rating ?? null)
  const positiveFeedback = isPositiveFeedback(effectiveRating)
  const issueConfig = ISSUE_CATEGORY_CONFIG[issueCategory]
  const issueTrackerSteps = booking ? getTrackerSteps(booking) : []
  const issueSlaLabel = formatSlaLabel(booking?.issueSlaTargetAt)
  const canRaiseIssue = Boolean(booking && ['confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(booking.status))

  React.useEffect(() => {
    if (!booking) return
    const nextCategory = booking.issueReported ? getIssueCategoryKeyFromBooking(booking) : 'leader_no_show'
    setIssueCategory(nextCategory)
    setIssueDesiredOutcome(booking.issueDesiredOutcome ?? ISSUE_CATEGORY_CONFIG[nextCategory].desiredOutcome)
    setIssueAttachments(booking.issueAttachmentUrls ?? [])
  }, [booking])

  const handleReschedule = async () => {
    if (!booking?.activityId) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({
      pathname: `/(root)/slots/${booking.activityId}`,
      params: { bookingId: booking.id, flowId: String(Date.now()) },
    })
  }

  const handleVerifyOtp = async () => {
    if (!parentUserId || !booking || otp.trim().length !== 6) return
    setVerifyingOtp(true)
    try {
      await parentApi.bookings.verifyOtp(booking.id, parentUserId, otp.trim())
      await queryClient.invalidateQueries({ queryKey: ['booking', id, parentUserId] })
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setOtp('')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: any) {
      Alert.alert('OTP verification failed', err?.message ?? 'Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleComplete = async () => {
    if (!parentUserId || !booking) return
    setCompleting(true)
    try {
      await parentApi.bookings.complete(booking.id, parentUserId)
      await queryClient.invalidateQueries({ queryKey: ['booking', id, parentUserId] })
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Class completed', 'The booking is now complete and teacher payout has been released.')
    } catch (err: any) {
      Alert.alert('Could not complete class', err?.message ?? 'Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!parentUserId || !id) return
            setCancelling(true)
            try {
              await parentApi.bookings.cancel(id, parentUserId)
              await queryClient.invalidateQueries({ queryKey: ['booking', id] })
              await queryClient.invalidateQueries({ queryKey: ['bookings'] })
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } catch (err: any) {
              Alert.alert('Could not cancel', err?.message ?? 'Please try again.')
            } finally {
              setCancelling(false)
            }
          },
        },
      ],
    )
  }

  const handleOpenMap = async () => {
    const target = encodeURIComponent(locationLabel)
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${target}`)
  }

  const handleSupport = () => {
    Alert.alert(
      'Support',
      booking?.issueCaseReference
        ? `Beam support can already see case ${booking.issueCaseReference}. You do not need to repeat the same details on chat or call.`
        : 'Beam support can help with venue coordination, timing, no-show, and refund questions.',
    )
  }

  const handleOpenIssueFlow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (booking?.issueReported) {
      setIssueFormOpen(false)
      return
    }
    const nextCategory = getIssueCategoryKeyFromBooking(booking)
    setIssueCategory(nextCategory)
    setIssueDesiredOutcome(ISSUE_CATEGORY_CONFIG[nextCategory].desiredOutcome)
    setIssueFormOpen((value) => !value)
  }

  const handleSelectFeedbackChoice = async (choice: FeedbackChoice) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFeedbackChoice(choice)
    if (choice === 'problem' && !issueNote.trim()) {
      setIssueNote('There was a problem during the session.')
      setIssueCategory('not_as_described')
      setIssueDesiredOutcome('support')
    }
  }

  const handleAddAttachmentReference = async () => {
    const nextValue = issueAttachmentInput.trim()
    if (!nextValue) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIssueAttachments((current) => current.includes(nextValue) ? current : [...current, nextValue].slice(0, 5))
    setIssueAttachmentInput('')
  }

  const handleRemoveAttachmentReference = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIssueAttachments((current) => current.filter((item) => item !== value))
  }

  const handleSubmitFeedback = async () => {
    if (!parentUserId || !booking || !feedbackChoice) return
    setSubmittingFeedback(true)
    try {
      const nextRating = getFeedbackChoiceMeta(feedbackChoice).rating
      await parentApi.bookings.submitFeedback(
        booking.id,
        parentUserId,
        nextRating,
        feedbackComment.trim() || undefined,
      )
      await queryClient.invalidateQueries({ queryKey: ['booking', id, parentUserId] })
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert(
        nextRating >= 4 ? 'Thanks for the feedback' : 'Thanks, we’ll look into it',
        nextRating >= 4
          ? 'You can now rebook the same activity or explore similar sessions.'
          : 'We saved your feedback. Support and issue reporting options stay available below.',
      )
    } catch (err: any) {
      Alert.alert('Could not save feedback', err?.message ?? 'Please try again.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleExploreSimilar = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({
      pathname: '/(root)/explore',
      params: { search: booking?.activityTitle ?? undefined },
    })
  }

  const handleReportIssue = async () => {
    if (!parentUserId || !booking) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setReportingIssue(true)
    try {
      const intakeAnswers = issueConfig.questions
        .map((question) => ({
          questionId: question.id,
          label: question.label,
          answer: issueAnswers[question.id]?.trim() ?? '',
        }))
        .filter((answer) => answer.answer.length > 0)

      await parentApi.bookings.reportIssue(booking.id, {
        parentId: parentUserId,
        issueType: issueConfig.issueType,
        description: issueNote.trim() || undefined,
        desiredOutcome: issueDesiredOutcome,
        requestedResolution:
          issueDesiredOutcome === 'refund'
            ? 'refund'
            : issueDesiredOutcome === 'credit'
              ? 'credit'
              : 'support_only',
        attachmentUrls: issueAttachments,
        intakeAnswers,
      })
      await queryClient.invalidateQueries({ queryKey: ['booking', id, parentUserId] })
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      Alert.alert(
        'Issue reported',
        'Your case is now in the tracker with the next action and expected update time.',
      )
      setIssueNote('')
      setIssueAnswers({})
      setIssueAttachments([])
      setIssueAttachmentInput('')
      setIssueFormOpen(false)
    } catch (err: any) {
      Alert.alert('Could not report issue', err?.message ?? 'Please try again.')
    } finally {
      setReportingIssue(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Booking Details" onBack={() => router.back()} />

      {isLoading ? (
        <BookingDetailSkeleton />
      ) : isError || !booking ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Couldn't load booking</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Activity image + title */}
          <View style={styles.heroCard}>
            <Image
              source={booking.activityImage ? { uri: booking.activityImage } : require('../../../assets/images/icon.png')}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                <Text style={styles.heroTitle} numberOfLines={2}>{booking.activityTitle ?? '—'}</Text>
                {booking.status && <StatusBadge status={booking.status} />}
              </View>
              <Text style={styles.bookingId}>Booking #{booking.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Session info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Details</Text>
            <InfoRow icon="calendar-outline"   label="Date"     value={formatDate(booking.scheduledAt)} />
            <InfoRow icon="time-outline"        label="Time"     value={formatTime(booking.scheduledAt)} />
            {booking.activityDuration && (
              <InfoRow icon="hourglass-outline" label="Duration" value={`${booking.activityDuration} minutes`} />
            )}
            <InfoRow icon="repeat-outline"     label="Type"     value={booking.sessionType ?? '1:1'} />
            <InfoRow icon="location-outline"   label="Location" value={locationLabel} />
          </View>

          {phase === 'upcoming' && (
            <View style={styles.phaseCard}>
              <Text style={styles.phaseTitle}>Upcoming</Text>
              <Text style={styles.phaseText}>Directions, preparation, reschedule or cancel, and contact details should be easy before the session week gets busy.</Text>
              <View style={styles.phaseList}>
                <PhasePoint text={`Directions: ${locationLabel}`} />
                <PhasePoint text={`Preparation: keep ${childName.toLowerCase()} ready 10 minutes early.`} />
                <PhasePoint text="Reschedule or cancel before the cutoff if plans change." />
                <PhasePoint text="Contact support if you need help with venue or timing." />
              </View>
            </View>
          )}

          {phase === 'today' && (
            <View style={[styles.phaseCard, styles.phaseCardToday]}>
              <Text style={[styles.phaseTitle, styles.phaseTitleToday]}>Today</Text>
              <Text style={[styles.phaseText, styles.phaseTextToday]}>Arrival instructions, what to bring, map access, and emergency support should be surfaced clearly on session day.</Text>
              <View style={styles.phaseList}>
                <PhasePoint text="Arrive 10 minutes early so check-in does not feel rushed." textColor={colors.primary} />
                <PhasePoint text="Carry water, comfort items, and anything the teacher already asked for." textColor={colors.primary} />
                <PhasePoint text={`Map and directions: ${locationLabel}`} textColor={colors.primary} />
                <PhasePoint text="Emergency support is available if the teacher is delayed or the venue is hard to find." textColor={colors.primary} />
              </View>
            </View>
          )}

          {/* Teacher info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Teacher</Text>
            <TouchableOpacity
              style={styles.teacherRow}
              onPress={async () => {
                if (!booking.teacherId) return
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push(`/(root)/teacher/${booking.teacherId}`)
              }}
              disabled={!booking.teacherId}
              activeOpacity={booking.teacherId ? 0.7 : 1}
            >
              {booking.teacherFirstName ? (
                <Avatar firstName={booking.teacherFirstName} lastName={booking.teacherLastName} size={44} colorIndex={0} />
              ) : (
                <Avatar firstName="?" size={44} colorIndex={0} />
              )}
              <Text style={styles.teacherName}>{teacherName}</Text>
              {booking.teacherId && (
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              )}
            </TouchableOpacity>
          </View>

          {(phase === 'upcoming' || phase === 'today') && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Before session</Text>
              <InfoRow icon="navigate-outline" label="Directions" value={locationLabel} />
              <InfoRow icon="bag-handle-outline" label="Preparation" value="Bring water, arrive early, and keep the child comfortable." />
              <InfoRow icon="call-outline" label="Support" value="Beam support available for venue, timing, or emergency help." />
              <View style={styles.inlineActions}>
                <Button variant="secondary" label="Open Map" onPress={handleOpenMap} />
                <Button variant="secondary" label="Contact Support" onPress={handleSupport} />
              </View>
            </View>
          )}

          {/* Payment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total paid</Text>
              <Text style={styles.paymentAmount}>₹{parseFloat(booking.totalAmount).toFixed(0)}</Text>
            </View>
            <Text style={styles.paymentHint}>
              {booking.payoutReleasedAt
                ? 'Teacher payout released after class completion.'
                : booking.paymentStatus === 'success'
                  ? 'Mock payment captured. Teacher payout will release after class completion.'
                  : 'Payment is pending.'}
            </Text>
          </View>

          {canRaiseIssue && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{booking.issueReported ? 'Case tracker' : 'Need help with this booking?'}</Text>
              {!booking.issueReported ? (
                <>
                  <Text style={styles.feedbackIntro}>
                    Raise an issue from here in under a minute. We auto-fill the booking context, ask only the relevant questions, and show the next update time in the app.
                  </Text>
                  <View style={styles.issueSummaryCard}>
                    <InfoRow icon="sparkles-outline" label="Activity" value={booking.activityTitle ?? '—'} />
                    <InfoRow icon="person-outline" label="Child" value={childName} />
                    <InfoRow icon="time-outline" label="Slot" value={`${formatDate(booking.scheduledAt)} · ${formatTime(booking.scheduledAt)}`} />
                    <InfoRow icon="card-outline" label="Total" value={`₹${parseFloat(booking.totalAmount).toFixed(0)}`} />
                  </View>
                  <Button
                    variant="secondary"
                    label={issueFormOpen ? 'Hide issue form' : 'Report issue'}
                    onPress={handleOpenIssueFlow}
                  />
                  {issueFormOpen && (
                    <View style={styles.issueFormCard}>
                      <Text style={styles.issueFormLabel}>Issue category</Text>
                      <View style={styles.issueChipWrap}>
                        {(Object.entries(ISSUE_CATEGORY_CONFIG) as Array<[IssueCategoryKey, typeof ISSUE_CATEGORY_CONFIG[IssueCategoryKey]]>).map(([key, config]) => {
                          const active = issueCategory === key
                          return (
                            <TouchableOpacity
                              key={key}
                              style={[styles.issueChip, active && styles.issueChipActive]}
                              onPress={() => {
                                setIssueCategory(key)
                                setIssueDesiredOutcome(config.desiredOutcome)
                              }}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>{config.label}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>

                      <Text style={styles.issueFormLabel}>Guided questions</Text>
                      {issueConfig.questions.map((question) => (
                        <View key={question.id} style={{ gap: spacing.xs }}>
                          <Text style={styles.issueQuestionLabel}>{question.label}</Text>
                          <TextInput
                            style={styles.guidedInput}
                            placeholder={question.placeholder}
                            placeholderTextColor={colors.gray}
                            value={issueAnswers[question.id] ?? ''}
                            onChangeText={(value) => setIssueAnswers((current) => ({ ...current, [question.id]: value }))}
                          />
                        </View>
                      ))}

                      <Text style={styles.issueFormLabel}>Preferred outcome</Text>
                      <View style={styles.issueChipWrap}>
                        {([
                          ['refund', 'Refund'],
                          ['credit', 'Beam credit'],
                          ['rebooking', 'Free rebooking'],
                          ['support', 'Support help'],
                        ] as const).map(([value, label]) => {
                          const active = issueDesiredOutcome === value
                          return (
                            <TouchableOpacity
                              key={value}
                              style={[styles.issueChip, active && styles.issueChipActive]}
                              onPress={() => setIssueDesiredOutcome(value)}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>{label}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>

                      <Text style={styles.issueFormLabel}>Photo or evidence link</Text>
                      <View style={styles.attachmentRow}>
                        <TextInput
                          style={[styles.guidedInput, { flex: 1 }]}
                          placeholder="Paste a photo or evidence link"
                          placeholderTextColor={colors.gray}
                          value={issueAttachmentInput}
                          onChangeText={setIssueAttachmentInput}
                        />
                        <TouchableOpacity style={styles.attachmentAddBtn} onPress={handleAddAttachmentReference} activeOpacity={0.85}>
                          <Ionicons name="add" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                      {!!issueAttachments.length && (
                        <View style={styles.issueChipWrap}>
                          {issueAttachments.map((attachment) => (
                            <TouchableOpacity key={attachment} style={styles.attachmentChip} onPress={() => handleRemoveAttachmentReference(attachment)} activeOpacity={0.85}>
                              <Text style={styles.attachmentChipText} numberOfLines={1}>{attachment}</Text>
                              <Ionicons name="close" size={14} color={colors.primary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      <Text style={styles.issueFormLabel}>Anything else?</Text>
                      <TextInput
                        style={styles.issueInput}
                        placeholder="Add any extra detail that will help Beam resolve this faster"
                        placeholderTextColor={colors.gray}
                        value={issueNote}
                        onChangeText={setIssueNote}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      <View style={styles.issueSlaBanner}>
                        <Text style={styles.issueSlaBannerText}>Expected update by 6pm. Your booking ID is auto-filled and stays attached to this case.</Text>
                      </View>
                      <Button
                        variant="primary"
                        label={reportingIssue ? 'Submitting…' : 'Submit issue'}
                        onPress={handleReportIssue}
                        disabled={reportingIssue}
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.caseHeaderRow}>
                    <View>
                      <Text style={styles.caseIdLabel}>Case ID</Text>
                      <Text style={styles.caseIdValue}>{booking.issueCaseReference ?? booking.issueId ?? '—'}</Text>
                    </View>
                    {issueSlaLabel ? (
                      <View style={styles.issueSlaPill}>
                        <Text style={styles.issueSlaPillText}>{issueSlaLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.issueTrackerCard}>
                    {issueTrackerSteps.map((step) => (
                      <View key={step.key} style={styles.issueTrackerStep}>
                        <View style={[styles.issueTrackerDot, step.active && styles.issueTrackerDotActive]} />
                        <Text style={[styles.issueTrackerText, step.active && styles.issueTrackerTextActive]}>{step.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.issueSummaryCard}>
                    <InfoRow icon="alert-circle-outline" label="Issue" value={ISSUE_CATEGORY_CONFIG[getIssueCategoryKeyFromBooking(booking)].label} />
                    <InfoRow icon="flag-outline" label="Preferred outcome" value={booking.issueDesiredOutcome?.replace('_', ' ') ?? 'Support'} />
                    <InfoRow icon="chatbox-ellipses-outline" label="Next action" value={booking.issueNextAction ?? 'Beam ops will update you in the app.'} />
                    <InfoRow icon="checkmark-done-outline" label="Resolution" value={booking.issueResolutionLabel ?? 'Pending review'} />
                  </View>
                  {!!booking.issueDescription && (
                    <View style={styles.caseNoteCard}>
                      <Text style={styles.caseNoteTitle}>Your notes</Text>
                      <Text style={styles.caseNoteText}>{booking.issueDescription}</Text>
                    </View>
                  )}
                  {(booking.issueIntakeAnswers ?? []).length > 0 && (
                    <View style={styles.caseNoteCard}>
                      <Text style={styles.caseNoteTitle}>What you shared</Text>
                      {(booking.issueIntakeAnswers ?? []).map((answer) => (
                        <View key={answer.questionId} style={{ gap: 2 }}>
                          <Text style={styles.caseAnswerLabel}>{answer.label}</Text>
                          <Text style={styles.caseAnswerText}>{answer.answer}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {(booking.issueAttachmentUrls ?? []).length > 0 && (
                    <View style={styles.issueChipWrap}>
                      {(booking.issueAttachmentUrls ?? []).map((attachment) => (
                        <View key={attachment} style={styles.attachmentChip}>
                          <Text style={styles.attachmentChipText} numberOfLines={1}>{attachment}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.inlineActions}>
                    <Button variant="secondary" label="Contact Support" onPress={handleSupport} />
                    {booking.issueStatus !== 'resolved' ? <Button variant="secondary" label="Refresh status" onPress={() => void refetch()} /> : null}
                  </View>
                </>
              )}
            </View>
          )}

          {(booking.otpVisible || booking.status === 'in_progress') && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Live session</Text>
              <Text style={styles.otpHint}>
                Ask the teacher for the 6-digit check-in code when the session starts, then enter it here to confirm attendance.
              </Text>
              {!arrived && (
                <TouchableOpacity
                  style={styles.arrivedPill}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setArrived(true)
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={styles.arrivedPillText}>I have arrived</Text>
                </TouchableOpacity>
              )}
              {!booking.teacherOtpVerifiedAt && (
                <>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={colors.gray}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <Button
                    variant="primary"
                    label={verifyingOtp ? 'Verifying…' : 'Verify OTP'}
                    onPress={handleVerifyOtp}
                    disabled={verifyingOtp || otp.trim().length !== 6}
                  />
                </>
              )}
              {!!booking.teacherOtpVerifiedAt && (
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.verifiedText}>OTP verified. You can complete the class after it ends.</Text>
                </View>
              )}
              <Button
                variant="secondary"
                label={booking.issueReported ? 'View case tracker' : 'Report issue'}
                onPress={handleOpenIssueFlow}
              />
            </View>
          )}

          {booking.status === 'completed' && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Completed session</Text>
                <InfoRow icon="document-text-outline" label="Recap" value={`${childName} completed ${booking.activityTitle ?? 'the session'} successfully.`} />
                <InfoRow icon="receipt-outline" label="Receipt" value={`₹${parseFloat(booking.totalAmount).toFixed(0)} · ${booking.paymentStatus ?? 'success'}`} />
                <InfoRow
                  icon="chatbubble-ellipses-outline"
                  label="Feedback"
                  value={
                    booking.feedbackSubmitted
                      ? booking.feedbackComment?.trim()
                        ? booking.feedbackComment
                        : `${booking.feedbackRating}/5 shared after the session`
                      : 'Give quick feedback first, then decide whether to rebook or ask for help.'
                  }
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>How did it go?</Text>
                <Text style={styles.feedbackIntro}>
                  Ask for the outcome first. Rebooking should happen only after we know whether the experience felt great or if support is needed.
                </Text>
                {!booking.feedbackSubmitted ? (
                  <>
                    <View style={styles.feedbackChoices}>
                      {([
                        ['loved_it', 'Loved it'],
                        ['okay', 'It was okay'],
                        ['not_really', 'Not really'],
                        ['problem', 'Was there a problem?'],
                      ] as const).map(([choice, label]) => {
                        const active = feedbackChoice === choice
                        return (
                          <TouchableOpacity
                            key={choice}
                            style={[styles.feedbackChoice, active && styles.feedbackChoiceActive]}
                            onPress={() => handleSelectFeedbackChoice(choice)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.feedbackChoiceText, active && styles.feedbackChoiceTextActive]}>{label}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                    {feedbackMeta && (
                      <>
                        <TextInput
                          style={styles.feedbackInput}
                          placeholder={feedbackMeta.placeholder}
                          placeholderTextColor={colors.gray}
                          value={feedbackComment}
                          onChangeText={setFeedbackComment}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                        <Button
                          variant="primary"
                          label={submittingFeedback ? 'Saving…' : `Save "${feedbackMeta.label}"`}
                          onPress={handleSubmitFeedback}
                          disabled={submittingFeedback}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <View style={[styles.feedbackSummaryCard, positiveFeedback ? styles.feedbackSummaryPositive : styles.feedbackSummaryConcern]}>
                    <Text style={[styles.feedbackSummaryTitle, positiveFeedback ? styles.feedbackSummaryTitlePositive : styles.feedbackSummaryTitleConcern]}>
                      {positiveFeedback ? 'Loved it' : 'Okay or issue noted'}
                    </Text>
                    <Text style={[styles.feedbackSummaryText, positiveFeedback ? styles.feedbackSummaryTextPositive : styles.feedbackSummaryTextConcern]}>
                      {positiveFeedback
                        ? 'Great. Rebooking prompts stay open while the positive memory is still fresh.'
                        : 'Support stays first and promotions stay softer until the issue is understood.'}
                    </Text>
                  </View>
                )}
              </View>

              {booking.feedbackSubmitted && positiveFeedback && (
                <View style={[styles.card, styles.rebookingCard]}>
                  <Text style={styles.cardTitle}>Rebooking prompts</Text>
                  <View style={styles.phaseList}>
                    <PhasePoint text="Same time next week" textColor={colors.primary} />
                    <PhasePoint text="Join a 4-session programme" textColor={colors.primary} />
                    <PhasePoint text="Try the next level" textColor={colors.primary} />
                    <PhasePoint text="Explore similar activities" textColor={colors.primary} />
                  </View>
                  <View style={styles.inlineActions}>
                    {booking.activityId && (
                      <Button
                        variant="secondary"
                        label="Same Time Next Week"
                        onPress={() => router.push({
                          pathname: `/(root)/slots/${booking.activityId}`,
                          params: { flowId: String(Date.now()) },
                        })}
                      />
                    )}
                    {booking.activityId && (
                      <Button variant="secondary" label="Join 4-Session Plan" onPress={() => router.push(`/(root)/choose-booking/${booking.activityId}`)} />
                    )}
                    <Button variant="secondary" label="Explore Similar" onPress={handleExploreSimilar} />
                  </View>
                </View>
              )}

              {booking.feedbackSubmitted && !positiveFeedback && (
                <View style={[styles.card, styles.supportFirstCard]}>
                  <Text style={styles.cardTitle}>If it was not positive</Text>
                  <View style={styles.phaseList}>
                    <PhasePoint text="Open support first." textColor={colors.coral} />
                    <PhasePoint text="Pause aggressive rebooking prompts." textColor={colors.coral} />
                    <PhasePoint text="Offer a clear resolution or next step." textColor={colors.coral} />
                    <PhasePoint text="Learn from the issue before asking to book again." textColor={colors.coral} />
                  </View>
                  <TextInput
                    style={styles.issueInput}
                    placeholder="Add anything else the Beam team should know"
                    placeholderTextColor={colors.gray}
                    value={issueNote}
                    onChangeText={setIssueNote}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.inlineActions}>
                    <Button variant="secondary" label="Contact Support" onPress={handleSupport} />
                    <Button
                      variant="secondary"
                      label={booking.issueReported ? 'View case tracker' : 'Raise Issue'}
                      onPress={handleOpenIssueFlow}
                    />
                    <Button variant="secondary" label="Explore Similar" onPress={handleExploreSimilar} />
                  </View>
                </View>
              )}
            </>
          )}

          {booking.status === 'cancelled' && (
            <View style={styles.phaseCardCancelled}>
              <Text style={styles.phaseTitleCancelled}>Cancelled</Text>
              <Text style={styles.phaseText}>This booking has been cancelled. Refund or credit handling should stay visible instead of making parents guess what happens next.</Text>
              <View style={styles.phaseList}>
                <PhasePoint text={`Payment status: ${booking.paymentStatus ?? 'pending'}`} textColor={colors.coral} />
                {booking.issueReported && (
                  <PhasePoint
                    text={`Issue status: ${booking.issueStatus ?? 'reported'}${booking.issueResolution ? ` · ${booking.issueResolution}` : ''}`}
                    textColor={colors.coral}
                  />
                )}
                <PhasePoint text="Refunds typically return to the original method, or Beam credit can be issued when applicable." textColor={colors.coral} />
              </View>
            </View>
          )}

          {/* Actions */}
          {booking.status === 'completed' && booking.activityId && booking.feedbackSubmitted && positiveFeedback && (
            <Button
              variant="secondary"
              icon="refresh-outline"
              label="Rebook this activity"
              onPress={() => router.push({
                pathname: `/(root)/slots/${booking.activityId}`,
                params: { flowId: String(Date.now()) },
              })}
            />
          )}
          {booking.canReschedule && (
            <Button
              variant="secondary"
              icon="repeat-outline"
              label="Reschedule Booking"
              onPress={handleReschedule}
            />
          )}
          {booking.canComplete && (
            <Button
              variant="primary"
              icon="checkmark-circle-outline"
              label={completing ? 'Completing…' : 'Complete Class'}
              onPress={handleComplete}
              disabled={completing}
            />
          )}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling
                ? <ActivityIndicator color={colors.coral} />
                : <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              }
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  backLink: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  scroll: { padding: spacing.md, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroImage: { width: '100%', height: 160 },
  heroBody: { padding: spacing.md, gap: spacing.xs },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroTitle: {
    flex: 1,
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  bookingId: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  phaseCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  phaseCardToday: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  phaseCardCancelled: {
    backgroundColor: '#FFF1F1',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F9B1B1',
    ...shadows.card,
  },
  phaseTitle: {
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  phaseTitleToday: { color: colors.primary },
  phaseTitleCancelled: {
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.coral,
  },
  phaseText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 22,
  },
  phaseTextToday: { color: colors.primary },
  phaseList: { gap: spacing.sm, marginTop: spacing.xs },
  inlineActions: { gap: spacing.sm },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherName: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  paymentAmount: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  paymentHint: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  feedbackIntro: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 21,
  },
  feedbackChoices: {
    gap: spacing.sm,
  },
  feedbackChoice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGray,
  },
  feedbackChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  feedbackChoiceText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  feedbackChoiceTextActive: {
    color: colors.primary,
  },
  feedbackInput: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
  },
  feedbackSummaryCard: {
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.xs,
  },
  feedbackSummaryPositive: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  feedbackSummaryConcern: {
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F9B1B1',
  },
  feedbackSummaryTitle: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
  feedbackSummaryTitlePositive: {
    color: colors.primary,
  },
  feedbackSummaryTitleConcern: {
    color: colors.coral,
  },
  feedbackSummaryText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    lineHeight: 20,
  },
  feedbackSummaryTextPositive: {
    color: colors.primary,
  },
  feedbackSummaryTextConcern: {
    color: colors.coral,
  },
  rebookingCard: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  supportFirstCard: {
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#F9B1B1',
  },
  otpHint: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 20,
  },
  otpInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.lightGray,
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
    letterSpacing: 4,
    textAlign: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifiedText: {
    flex: 1,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.success,
  },
  arrivedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.mint,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  arrivedPillText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  issueInput: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
  },
  issueSummaryCard: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.sm,
  },
  issueFormCard: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.md,
  },
  issueFormLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  issueQuestionLabel: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  guidedInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
  },
  issueChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  issueChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  issueChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  issueChipText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  issueChipTextActive: {
    color: colors.primary,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attachmentAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  attachmentChip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.mint,
  },
  attachmentChipText: {
    maxWidth: 220,
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  issueSlaBanner: {
    borderRadius: radius.input,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  issueSlaBannerText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: '#9A6700',
    lineHeight: 18,
  },
  caseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  caseIdLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.gray,
  },
  caseIdValue: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  issueSlaPill: {
    borderRadius: radius.badge,
    backgroundColor: '#FCB857',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  issueSlaPillText: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  issueTrackerCard: {
    backgroundColor: colors.lightGray,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: spacing.md,
  },
  issueTrackerStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  issueTrackerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
  },
  issueTrackerDotActive: {
    backgroundColor: colors.primary,
  },
  issueTrackerText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
  },
  issueTrackerTextActive: {
    color: colors.navy,
  },
  caseNoteCard: {
    borderRadius: radius.input,
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    gap: spacing.sm,
  },
  caseNoteTitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  caseNoteText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    lineHeight: 21,
  },
  caseAnswerLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.gray,
  },
  caseAnswerText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
    lineHeight: 20,
  },
  cancelBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.coral,
  },
})

function PhasePoint({ text, textColor }: { text: string; textColor?: string }) {
  return (
    <View style={stylesPoint.row}>
      <View style={[stylesPoint.dot, textColor ? { backgroundColor: textColor } : null]} />
      <Text style={[stylesPoint.text, textColor ? { color: textColor } : null]}>{text}</Text>
    </View>
  )
}

const stylesPoint = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7 },
  text: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 21 },
})
