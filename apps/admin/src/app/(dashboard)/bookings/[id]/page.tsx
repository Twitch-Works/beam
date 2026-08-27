'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { formatInr } from '@/lib/formatters'
import { adminApi } from '@/lib/api'
import { SkeletonLine } from '@/components/Skeleton'
import { BOOKING_STATUS_BADGE, PAYMENT_STATUS_BADGE, PAYOUT_STATUS_BADGE } from '@/lib/status-badges'

type BookingDetail = {
  id: string
  rawId: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'pending' | 'in_progress'
  dateTime: string
  sessionType: '1:1' | 'group'
  amount: number
  paymentReference: string
  paymentStatus: 'success' | 'failed' | 'refunded' | 'pending'
  payoutStatus: 'queued' | 'dispatched' | 'settled' | 'failed' | null
  payoutAmount: number | null
  child:   { name: string; age: number; initials: string }
  parent:  { name: string; phone: string; email: string }
  teacher: { name: string; phone: string; rating: number; specialties: string[]; assigned: boolean }
  activity: { title: string; category: string; duration: string; price: number }
  feedback: { id: string | null; submitted: boolean; rating: number | null; comment: string | null; flagged: boolean }
  issue: { id: string | null; reported: boolean; type: string | null; status: string | null; resolution: string | null; description: string | null }
  timeline: { label: string; time: string; done: boolean; note?: string }[]
}

const mockBooking: BookingDetail = {
  id: 'BK-12589',
  rawId: 'BK-12589',
  status: 'confirmed',
  dateTime: '16 May 2026, 4:00 PM',
  sessionType: '1:1',
  amount: 649,
  paymentReference: 'mock_BK12589',
  paymentStatus: 'success',
  payoutStatus: 'queued',
  payoutAmount: null,
  child:   { name: 'Aarav Mehta',      age: 3, initials: 'AM' },
  parent:  { name: 'Rahul Mehta',      phone: '+91 98765 10001', email: 'rahul.mehta@gmail.com' },
  teacher: { name: 'Ms. Priya Sharma', phone: '+91 98765 43210', rating: 4.9, specialties: ['Messy Play', 'Art & Craft'], assigned: true },
  activity: { title: 'Messy Play Session', category: 'Messy Play', duration: '60 min', price: 649 },
  feedback: { id: null, submitted: false, rating: null, comment: null, flagged: false },
  issue: { id: null, reported: false, type: null, status: null, resolution: null, description: null },
  timeline: [
    { label: 'Booking Created',   time: '10 May 2026, 9:14 AM',  done: true,  note: 'Parent booked via web app' },
    { label: 'Mock Payment Captured',  time: '10 May 2026, 9:15 AM',  done: true,  note: 'Mock payment recorded successfully' },
    { label: 'Teacher Confirmed', time: '10 May 2026, 10:02 AM', done: true,  note: 'Ms. Priya Sharma accepted' },
    { label: 'Class OTP Verified', time: '—',                     done: false, note: 'Parent verifies teacher arrival at class time' },
    { label: 'Parent Completed Class', time: '—',                 done: false },
    { label: 'Teacher Payout Released', time: '—',                done: false },
  ],
}

function buildTimeline(b: any): BookingDetail['timeline'] {
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const steps: BookingDetail['timeline'] = [
    { label: 'Booking Created', time: fmt(b.createdAt), done: !!b.createdAt, note: 'Parent booked from the parent app' },
    { label: 'WhatsApp Sent To Teacher', time: fmt(b.lastWhatsAppSentAt), done: !!b.lastWhatsAppSentAt, note: 'Teacher booking request notification sent' },
    { label: 'Mock Payment Captured', time: fmt(b.payment?.createdAt ?? b.createdAt), done: !!b.payment, note: b.payment ? `Payment status: ${b.payment.status}` : undefined },
    { label: 'Teacher Confirmed', time: fmt(b.confirmedAt), done: !!b.confirmedAt, note: b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName ?? ''}`.trim() + ' accepted the booking' : undefined },
    { label: 'Class OTP Verified', time: fmt(b.teacherOtpVerifiedAt), done: !!b.teacherOtpVerifiedAt, note: b.teacherOtpVerifiedAt ? 'Teacher arrival verified by parent OTP match' : undefined },
    { label: 'Parent Completed Class', time: fmt(b.parentCompletedAt ?? b.completedAt), done: !!(b.parentCompletedAt ?? b.completedAt), note: !!(b.parentCompletedAt ?? b.completedAt) ? 'Class marked complete from parent side' : undefined },
    { label: 'Feedback Received', time: fmt(b.review?.createdAt), done: !!b.review, note: b.review ? `${b.review.rating}/5${b.review.comment ? ` · ${b.review.comment}` : ''}` : undefined },
    { label: 'Issue Reported', time: fmt(b.latestIssue?.reportedAt), done: !!b.latestIssue, note: b.latestIssue ? `${b.latestIssue.issueType}${b.latestIssue.resolution ? ` · ${b.latestIssue.resolution}` : ''}` : undefined },
    { label: 'Teacher Payout Released', time: fmt(b.payoutReleasedAt ?? b.payout?.settledAt), done: !!(b.payoutReleasedAt ?? b.payout?.settledAt), note: b.payout ? `Payout ${b.payout.status}` : undefined },
  ]
  return steps
}

export default function BookingDetailPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const params = useParams()
  const [confirmAction, setConfirmAction] = useState<'idle' | 'cancel' | 'refund' | 'reassign'>('idle')
  const [actionDone, setActionDone] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [reassignTeacherId, setReassignTeacherId] = useState('')
  const [liveBooking, setLiveBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewEscalationOpen, setReviewEscalationOpen] = useState(false)
  const [reviewEscalationNote, setReviewEscalationNote] = useState('')
  const [reviewEscalationResolution, setReviewEscalationResolution] = useState<'none' | 'support_only' | 'credit' | 'refund'>('support_only')
  const [issueDraftStatus, setIssueDraftStatus] = useState<'reported' | 'reviewing' | 'resolved'>('reviewing')
  const [issueDraftResolution, setIssueDraftResolution] = useState<'none' | 'support_only' | 'credit' | 'refund'>('support_only')
  const [issueDraftDescription, setIssueDraftDescription] = useState('')

  async function loadBookingDetail() {
    if (USE_MOCK_DATA) {
      setLoading(false)
      return
    }

    setLoading(true)
    const id = params.id as string
    try {
      const b = await adminApi.bookings.get(id)
      const teacherProfile = b.teacher?.teacher ?? null

      const childDob = b.child?.dateOfBirth ? new Date(b.child.dateOfBirth) : null
      const childAge = childDob ? Math.floor((Date.now() - childDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0
      const childName = `${b.child?.firstName ?? ''} ${b.child?.lastName ?? ''}`.trim() || '—'

      const sessionDate = b.slot?.startTime
        ? new Date(b.slot.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

      const durationMins = b.activity?.sessionDurationMins
      const duration = durationMins ? `${durationMins} min` : '—'

      setLiveBooking({
        id: (b.id as string).slice(0, 8).toUpperCase(),
        rawId: b.id as string,
        status: (b.status ?? 'pending') as BookingDetail['status'],
        dateTime: sessionDate,
        sessionType: b.sessionType === 'group' ? 'group' : '1:1',
        amount: Number(b.payment?.amount ?? b.totalAmount ?? 0),
        paymentReference: b.payment?.gatewayPaymentId ?? b.payment?.razorpayId ?? '—',
        paymentStatus: (b.payment?.status ?? 'pending') as BookingDetail['paymentStatus'],
        payoutStatus: (b.payout?.status ?? null) as BookingDetail['payoutStatus'],
        payoutAmount: b.payout?.amount ? Number(b.payout.amount) : null,
        child: {
          name: childName,
          age: childAge,
          initials: childName.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
        },
        parent: {
          name: `${b.parent?.firstName ?? ''} ${b.parent?.lastName ?? ''}`.trim() || '—',
          phone: b.parent?.phone ?? '—',
          email: b.parent?.email ?? '—',
        },
        teacher: {
          name: b.teacher ? `${b.teacher.firstName ?? ''} ${b.teacher.lastName ?? ''}`.trim() : 'Unassigned',
          phone: b.teacher?.phone ?? '—',
          rating: Number(teacherProfile?.rating ?? 0),
          specialties: teacherProfile?.specializations ?? [],
          assigned: !!b.teacher,
        },
        activity: {
          title: b.activity?.title ?? '—',
          category: b.activity?.categoryName ?? b.activity?.category?.name ?? '—',
          duration,
          price: Number(b.activity?.pricePerSession ?? b.payment?.amount ?? 0),
        },
        feedback: {
          id: b.review?.id ?? null,
          submitted: !!b.review,
          rating: b.review?.rating != null ? Number(b.review.rating) : null,
          comment: b.review?.comment ?? null,
          flagged: Boolean(b.review?.isFlagged),
        },
        issue: {
          id: b.latestIssue?.id ?? null,
          reported: !!b.latestIssue,
          type: b.latestIssue?.issueType ?? null,
          status: b.latestIssue?.status ?? null,
          resolution: b.latestIssue?.resolution ?? null,
          description: b.latestIssue?.description ?? null,
        },
        timeline: buildTimeline(b),
      })

      setIssueDraftStatus((b.latestIssue?.status ?? 'reviewing') as 'reported' | 'reviewing' | 'resolved')
      setIssueDraftResolution((b.latestIssue?.resolution ?? 'support_only') as 'none' | 'support_only' | 'credit' | 'refund')
      setIssueDraftDescription(b.latestIssue?.description ?? '')
      setReviewEscalationNote(b.review?.comment ?? '')
      setReviewEscalationResolution((b.latestIssue?.resolution ?? 'support_only') as 'none' | 'support_only' | 'credit' | 'refund')
    } catch {
      // fall back to mock
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookingDetail()
  }, [USE_MOCK_DATA, params.id])

  const booking = USE_MOCK_DATA ? mockBooking : (liveBooking ?? mockBooking)

  async function handleCancel() {
    const rawId = params.id as string
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.bookings.cancel(rawId)
      await loadBookingDetail()
      setActionDone('Booking cancelled.')
      setConfirmAction('idle')
    } catch {
      setActionError('Failed to cancel. Please try again.')
    } finally {
      setActionPending(false)
    }
  }

  async function handleRefund() {
    const rawId = params.id as string
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.payments.refund(rawId)
      await loadBookingDetail()
      setActionDone('Refund issued successfully.')
      setConfirmAction('idle')
    } catch (e: any) {
      setActionError(e?.message?.includes('already refunded') ? 'Payment is already refunded.' : 'Failed to issue refund. Please try again.')
    } finally {
      setActionPending(false)
    }
  }

  async function handleReassign() {
    if (!reassignTeacherId.trim()) return
    const rawId = params.id as string
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.bookings.assign(rawId, { teacherId: reassignTeacherId.trim() })
      await loadBookingDetail()
      setActionDone('Teacher reassigned successfully.')
      setConfirmAction('idle')
      setReassignTeacherId('')
    } catch {
      setActionError('Failed to reassign teacher. Check the teacher ID and try again.')
    } finally {
      setActionPending(false)
    }
  }

  async function handleReviewFlag(nextFlagged: boolean) {
    if (!booking.feedback.id || USE_MOCK_DATA) return
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.reviews.flag(booking.feedback.id, { flagged: nextFlagged })
      await loadBookingDetail()
      setActionDone(nextFlagged ? 'Feedback flagged for quality follow-up.' : 'Feedback flag removed.')
    } catch {
      setActionError('Failed to update review flag.')
    } finally {
      setActionPending(false)
    }
  }

  async function handleReviewEscalation() {
    if (!booking.feedback.id || USE_MOCK_DATA) return
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.reviews.escalate(booking.feedback.id, {
        issueType: booking.feedback.rating != null && booking.feedback.rating <= 2 ? 'other' : 'schedule_issue',
        resolution: reviewEscalationResolution,
        description: reviewEscalationNote.trim() || booking.feedback.comment || undefined,
      })
      await loadBookingDetail()
      setReviewEscalationOpen(false)
      setActionDone('Feedback escalated into the session support queue.')
    } catch {
      setActionError('Failed to escalate feedback.')
    } finally {
      setActionPending(false)
    }
  }

  async function handleIssueUpdate() {
    if (!booking.issue.id || USE_MOCK_DATA) return
    setActionPending(true)
    setActionError('')
    try {
      await adminApi.disputes.updateIssue(booking.issue.id, {
        status: issueDraftStatus,
        resolution: issueDraftResolution,
        description: issueDraftDescription.trim() || undefined,
      })
      await loadBookingDetail()
      setActionDone(
        issueDraftStatus === 'resolved'
          ? issueDraftResolution === 'refund'
            ? 'Issue resolved and refund processed if payment was successful.'
            : 'Issue marked resolved.'
          : 'Issue updated successfully.'
      )
    } catch {
      setActionError('Failed to update session issue.')
    } finally {
      setActionPending(false)
    }
  }

  const bookingBadge = BOOKING_STATUS_BADGE[booking.status]
  const paymentBadge = PAYMENT_STATUS_BADGE[booking.paymentStatus]
  const payoutBadge = booking.payoutStatus ? PAYOUT_STATUS_BADGE[booking.payoutStatus] : null

  return (
    <div>
      {/* Header */}
      <div className="detail-header">
        <button className="detail-header__back" onClick={() => router.back()} type="button">← Back to Bookings</button>
      </div>

      {/* Booking hero */}
      <div className="card" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {loading ? (
          <>
            <div>
              <SkeletonLine width={80} height={11} style={{ marginBottom: 6 }} />
              <SkeletonLine width={140} height={28} />
            </div>
            <SkeletonLine width={72} height={22} style={{ borderRadius: 20 }} />
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <SkeletonLine width={70} height={11} style={{ marginBottom: 6 }} />
              <SkeletonLine width={120} height={16} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <SkeletonLine width={50} height={11} style={{ marginBottom: 6 }} />
              <SkeletonLine width={80} height={20} />
            </div>
          </>
        ) : (
          <>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray)', marginBottom: 4 }}>Booking ID</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>{booking.id}</p>
            </div>
            <span className={bookingBadge.cls} style={{ textTransform: 'capitalize', fontSize: 13 }}>{bookingBadge.label}</span>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--color-gray)' }}>Session Date</p>
              <p style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{booking.dateTime}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--color-gray)' }}>Amount</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>{formatInr(booking.amount)}</p>
            </div>
          </>
        )}
      </div>

      {/* Three info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        {/* Child & Parent */}
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Child & Parent</h2>
          {loading ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <SkeletonLine width={110} height={14} style={{ marginBottom: 6 }} />
                  <SkeletonLine width={70} height={12} />
                </div>
              </div>
              <SkeletonLine width={50} height={11} style={{ marginBottom: 5 }} />
              <SkeletonLine width={100} height={14} style={{ marginBottom: 4 }} />
              <SkeletonLine width={120} height={12} style={{ marginBottom: 3 }} />
              <SkeletonLine width={140} height={12} />
            </>
          ) : (
            <>
              <div className="cell-person" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="avatar">{booking.child.initials}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{booking.child.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>Age {booking.child.age} years</p>
                </div>
              </div>
              <div>
                <p className="info-item__label">Parent</p>
                <p className="info-item__value">{booking.parent.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 2 }}>{booking.parent.phone}</p>
                <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>{booking.parent.email}</p>
              </div>
            </>
          )}
        </div>

        {/* Teacher */}
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Teacher</h2>
          {loading ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <SkeletonLine width={120} height={14} style={{ marginBottom: 6 }} />
                  <SkeletonLine width={50} height={12} />
                </div>
              </div>
              <SkeletonLine width={100} height={12} style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <SkeletonLine width={70} height={22} style={{ borderRadius: 6 }} />
                <SkeletonLine width={80} height={22} style={{ borderRadius: 6 }} />
              </div>
            </>
          ) : (
            <>
              <div className="cell-person" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="avatar">{booking.teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{booking.teacher.name}</p>
                  <p style={{ fontSize: 12, color: booking.teacher.assigned ? 'var(--color-yellow)' : 'var(--color-coral)' }}>
                    {booking.teacher.assigned ? `★ ${booking.teacher.rating.toFixed(1)}` : 'Teacher not assigned yet'}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-gray)', marginBottom: 8 }}>{booking.teacher.phone}</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {booking.teacher.specialties.length > 0
                  ? booking.teacher.specialties.map(s => <span key={s} className="tag">{s}</span>)
                  : <span className="tag tag--gray">Awaiting assignment</span>}
              </div>
            </>
          )}
        </div>

        {/* Activity */}
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Activity</h2>
          {loading ? (
            <>
              <SkeletonLine width="85%" height={14} style={{ marginBottom: 12 }} />
              {['Category', 'Type', 'Duration', 'Price', 'Payment Ref', 'Payout'].map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <SkeletonLine width={60} height={12} />
                  <SkeletonLine width={70} height={12} />
                </div>
              ))}
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{booking.activity.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Category</span>
                  <span className="tag">{booking.activity.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Type</span>
                  <span className="tag tag--gray">{booking.sessionType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Duration</span>
                  <span style={{ fontWeight: 600 }}>{booking.activity.duration}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Price</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>{formatInr(booking.activity.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Payment Ref</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-gray)' }}>{booking.paymentReference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-gray)' }}>Payment</span>
                  <span className={paymentBadge.cls}>{paymentBadge.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-gray)' }}>Payout</span>
                  {payoutBadge
                    ? <span className={payoutBadge.cls}>{payoutBadge.label}</span>
                    : <span className="tag tag--gray">Not released</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--color-gray)' }}>Revenue Realized</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', fontWeight: 600 }}>
                    {booking.payoutAmount ? formatInr(booking.payoutAmount) : '—'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Post-session Feedback</h2>
          {loading ? (
            <>
              <SkeletonLine width={110} height={14} style={{ marginBottom: 8 }} />
              <SkeletonLine width="80%" height={12} />
            </>
          ) : booking.feedback.submitted ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-navy)' }}>
                  {booking.feedback.rating}/5
                </p>
                {booking.feedback.flagged ? <span className="tag" style={{ background: '#FEF3C7', color: '#92400E' }}>Flagged</span> : null}
                {booking.issue.reported ? <span className="tag">Escalated to support</span> : null}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                {booking.feedback.rating && booking.feedback.rating >= 4
                  ? 'Positive feedback, eligible for rebooking prompts.'
                  : 'Non-positive feedback, support-first follow-up recommended.'}
              </p>
              {booking.feedback.comment && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-navy)', lineHeight: 1.6 }}>{booking.feedback.comment}</p>
                </div>
              )}
              {!USE_MOCK_DATA && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => void handleReviewFlag(!booking.feedback.flagged)} disabled={actionPending} type="button">
                      {actionPending ? 'Saving…' : booking.feedback.flagged ? 'Remove Flag' : 'Flag For Review'}
                    </button>
                    <button className="btn btn--secondary btn--sm" onClick={() => setReviewEscalationOpen((value) => !value)} disabled={actionPending} type="button">
                      {reviewEscalationOpen ? 'Hide Escalation' : 'Escalate Feedback'}
                    </button>
                  </div>
                  {reviewEscalationOpen && (
                    <div style={{ background: 'var(--color-mint)', padding: 'var(--space-3)', borderRadius: 'var(--radius-input)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 8 }}>Escalation details</p>
                      <select
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }}
                        value={reviewEscalationResolution}
                        onChange={(e) => setReviewEscalationResolution(e.target.value as 'none' | 'support_only' | 'credit' | 'refund')}
                      >
                        <option value="support_only">Support follow-up</option>
                        <option value="credit">Offer credit</option>
                        <option value="refund">Review for refund</option>
                        <option value="none">No resolution yet</option>
                      </select>
                      <textarea
                        style={{ width: '100%', minHeight: 88, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                        placeholder="What should ops know about this escalation?"
                        value={reviewEscalationNote}
                        onChange={(e) => setReviewEscalationNote(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn btn--primary btn--sm" onClick={handleReviewEscalation} disabled={actionPending} type="button">
                          {actionPending ? 'Escalating…' : 'Send To Support'}
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => setReviewEscalationOpen(false)} disabled={actionPending} type="button">Dismiss</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>No parent feedback has been submitted for this session yet.</p>
          )}
        </div>

        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Issue Resolution</h2>
          {loading ? (
            <>
              <SkeletonLine width={120} height={14} style={{ marginBottom: 8 }} />
              <SkeletonLine width="75%" height={12} />
            </>
          ) : booking.issue.reported ? (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="tag tag--gray">{booking.issue.type ?? 'Issue'}</span>
                <span className="tag" style={{ background: '#FEE2E2', color: '#991B1B' }}>{booking.issue.status ?? 'reported'}</span>
                {booking.issue.resolution && <span className="tag">{booking.issue.resolution}</span>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                {booking.issue.description ?? 'The parent reported an issue and expects follow-up from Beam ops.'}
              </p>
              {!USE_MOCK_DATA && booking.issue.id && (
                <div style={{ marginTop: 12, padding: 'var(--space-3)', borderRadius: 'var(--radius-input)', background: 'var(--color-bg)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 8 }}>Ops resolution</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <select
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, boxSizing: 'border-box' }}
                      value={issueDraftStatus}
                      onChange={(e) => setIssueDraftStatus(e.target.value as 'reported' | 'reviewing' | 'resolved')}
                    >
                      <option value="reported">Reported</option>
                      <option value="reviewing">Under review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <select
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, boxSizing: 'border-box' }}
                      value={issueDraftResolution}
                      onChange={(e) => setIssueDraftResolution(e.target.value as 'none' | 'support_only' | 'credit' | 'refund')}
                    >
                      <option value="support_only">Support only</option>
                      <option value="credit">Credit</option>
                      <option value="refund">Refund</option>
                      <option value="none">No resolution</option>
                    </select>
                  </div>
                  <textarea
                    style={{ width: '100%', minHeight: 92, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
                    placeholder="Resolution notes shown to ops and used for parent update"
                    value={issueDraftDescription}
                    onChange={(e) => setIssueDraftDescription(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn btn--primary btn--sm" onClick={handleIssueUpdate} disabled={actionPending} type="button">
                      {actionPending ? 'Saving…' : 'Save Resolution'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>No issue has been reported against this booking.</p>
          )}
        </div>
      </div>

      {/* Timeline + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-3)', alignItems: 'start' }}>
        {/* Timeline */}
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Booking Timeline</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: i < 4 ? 'var(--space-4)' : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
                    {i < 4 && <div className="skeleton" style={{ width: 2, flex: 1, minHeight: 24, marginTop: 2 }} />}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <SkeletonLine width={120} height={13} style={{ marginBottom: 5 }} />
                    <SkeletonLine width={90} height={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {booking.timeline.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: i < booking.timeline.length - 1 ? 'var(--space-4)' : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.done ? 'var(--color-success)' : 'var(--color-border)',
                      color: step.done ? 'white' : 'var(--color-gray)', fontSize: 10, fontWeight: 700,
                    }}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    {i < booking.timeline.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 24, background: step.done ? 'var(--color-success)' : 'var(--color-border)', marginTop: 2 }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: step.done ? 'var(--color-navy)' : 'var(--color-gray)' }}>{step.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 2 }}>{step.time}</p>
                    {step.note && <p style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 2, fontStyle: 'italic' }}>{step.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Actions</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <SkeletonLine height={36} style={{ borderRadius: 8 }} />
              <SkeletonLine height={36} style={{ borderRadius: 8 }} />
              <SkeletonLine height={36} style={{ borderRadius: 8 }} />
            </div>
          ) : (
            <>
              {actionDone && (
                <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-input)', marginBottom: 'var(--space-3)', fontSize: 12, fontWeight: 600 }}>
                  ✓ {actionDone}
                </div>
              )}
              {actionError && (
                <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error-text)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-input)', marginBottom: 'var(--space-3)', fontSize: 12, fontWeight: 600 }}>
                  ✗ {actionError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {confirmAction === 'idle' && (
                  <>
                    <button className="btn btn--secondary" style={{ justifyContent: 'center' }} onClick={() => { setConfirmAction('reassign'); setActionError('') }} type="button">
                      Reassign Teacher
                    </button>
                    <button className="btn btn--ghost" style={{ justifyContent: 'center' }} onClick={() => { setConfirmAction('cancel'); setActionError('') }} type="button">
                      Cancel Booking
                    </button>
                    <button className="btn btn--danger" style={{ justifyContent: 'center' }} onClick={() => { setConfirmAction('refund'); setActionError('') }} type="button" disabled={booking.paymentStatus === 'refunded'}>
                      Refund Payment
                    </button>
                  </>
                )}
                {confirmAction === 'reassign' && (
                  <div style={{ background: 'var(--color-mint)', padding: 'var(--space-3)', borderRadius: 'var(--radius-input)', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-navy)' }}>Enter new teacher ID</p>
                    <input
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }}
                      placeholder="Teacher UUID…"
                      value={reassignTeacherId}
                      onChange={e => setReassignTeacherId(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--primary btn--sm" onClick={handleReassign} disabled={actionPending || !reassignTeacherId.trim()} type="button">
                        {actionPending ? 'Saving…' : 'Confirm'}
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => { setConfirmAction('idle'); setReassignTeacherId('') }} type="button">Dismiss</button>
                    </div>
                  </div>
                )}
                {confirmAction === 'cancel' && (
                  <div style={{ background: 'var(--color-warning-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-input)', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-warning-text)' }}>Cancel this booking?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--danger btn--sm" onClick={handleCancel} disabled={actionPending} type="button">{actionPending ? 'Cancelling…' : 'Confirm Cancel'}</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setConfirmAction('idle')} type="button">Dismiss</button>
                    </div>
                  </div>
                )}
                {confirmAction === 'refund' && (
                  <div style={{ background: 'var(--color-error-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-input)', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-error-text)' }}>Refund {formatInr(booking.amount)} to parent?</p>
                    <p style={{ fontSize: 11, color: 'var(--color-error-text)', marginBottom: 8 }}>This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--danger btn--sm" onClick={handleRefund} disabled={actionPending} type="button">{actionPending ? 'Processing…' : 'Confirm Refund'}</button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setConfirmAction('idle')} type="button">Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
