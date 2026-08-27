'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Flag, AlertTriangle, Star, MessageSquare } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useMockMode } from '@/lib/mock-mode'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'

interface Review {
  id: string
  bookingId: string
  parentName: string
  teacherName: string
  activity: string
  rating: number
  comment: string
  flagged: boolean
  date: string
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'RV-DEMO-1',
    bookingId: 'BK-DEMO-101',
    parentName: 'Asha Kapoor',
    teacherName: 'Ritu Sharma',
    activity: 'Junior Pottery Explorers',
    rating: 5,
    comment: 'Strong first session. The facilitator kept the group engaged and the child wanted to return.',
    flagged: false,
    date: '2026-08-20',
  },
  {
    id: 'RV-DEMO-2',
    bookingId: 'BK-DEMO-102',
    parentName: 'Vikram Bansal',
    teacherName: 'Neha Verma',
    activity: 'Football Trial',
    rating: 2,
    comment: 'Coach arrived late and the trial felt rushed. Parent requested follow-up.',
    flagged: true,
    date: '2026-08-21',
  },
  {
    id: 'RV-DEMO-3',
    bookingId: 'BK-DEMO-103',
    parentName: 'Meera Nair',
    teacherName: 'Kunal Rao',
    activity: 'Story Lab',
    rating: 4,
    comment: 'Good session quality. Parent is considering the recurring program.',
    flagged: false,
    date: '2026-08-22',
  },
]

const PAGE_SIZE = 10

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((score) => (
        <span key={score} style={{ fontSize: 14, color: score <= rating ? 'var(--color-yellow)' : '#E2E8F0' }}>★</span>
      ))}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ReviewsPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const [tab, setTab] = useState<'all' | 'flagged' | 'low'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [metrics, setMetrics] = useState({ total: 0, avgRating: '0.0', flagged: 0 })
  const [actionKey, setActionKey] = useState<string | null>(null)

  async function loadReviews() {
    if (USE_MOCK_DATA) {
      setReviews(MOCK_REVIEWS)
      setMetrics({
        total: MOCK_REVIEWS.length,
        avgRating: (MOCK_REVIEWS.reduce((sum, review) => sum + review.rating, 0) / MOCK_REVIEWS.length).toFixed(1),
        flagged: MOCK_REVIEWS.filter((review) => review.flagged).length,
      })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await adminApi.reviews.list({
        flagged: tab === 'flagged' ? true : undefined,
        maxRating: tab === 'low' ? 2 : undefined,
        search: search || undefined,
      })

      setReviews(
        response.items.map((item: any) => ({
          id: item.id,
          bookingId: item.bookingId ?? '',
          parentName: [item.parentFirstName, item.parentLastName].filter(Boolean).join(' ').trim() || 'Unknown parent',
          teacherName: [item.teacherFirstName, item.teacherLastName].filter(Boolean).join(' ').trim() || 'Teacher not assigned',
          activity: item.activityTitle ?? 'Unknown activity',
          rating: Number(item.rating ?? 0),
          comment: item.comment ?? '',
          flagged: Boolean(item.isFlagged),
          date: (item.createdAt ?? '').split('T')[0],
        }))
      )
      setMetrics({
        total: Number(response.total ?? 0),
        avgRating: response.avgRating ?? '0.0',
        flagged: Number(response.flagged ?? 0),
      })
      setApiUnavailable(false)
    } catch {
      setApiUnavailable(true)
      setReviews([])
      setMetrics({ total: 0, avgRating: '0.0', flagged: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [USE_MOCK_DATA, search, tab])

  async function runReviewAction(key: string, action: () => Promise<void>) {
    if (USE_MOCK_DATA) return
    setActionKey(key)
    try {
      await action()
      await loadReviews()
    } finally {
      setActionKey(null)
    }
  }

  const lowScoreCount = useMemo(() => reviews.filter((review) => review.rating <= 2).length, [reviews])
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE)
  const paged = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader title="Reviews & Feedback" subtitle="Parent ratings, quality flags, and low-score triage">
        <button className="btn btn--secondary btn--sm">Export CSV</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live review data is unavailable. The quality queue cannot be trusted until the API is back." />}

      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonStatCard key={index} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Reviews', value: metrics.total, delta: 'Across parent feedback', up: true, Icon: MessageSquare, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Average Rating', value: metrics.avgRating, delta: 'Platform-wide', up: true, Icon: Star, iconBg: '#FEF3C7', iconColor: '#FCB857' },
            { label: 'Flagged Reviews', value: metrics.flagged, delta: 'Need admin action', up: false, Icon: Flag, iconBg: '#FEE2E2', iconColor: '#DC2626' },
            { label: 'Low Score (≤2★)', value: lowScoreCount, delta: 'Intervention queue', up: false, Icon: AlertTriangle, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          ].map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <div className="table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 24px' }}>
          {(['all', 'flagged', 'low'] as const).map((nextTab) => (
            <button
              key={nextTab}
              onClick={() => { setTab(nextTab); setPage(1) }}
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: tab === nextTab ? 'var(--color-primary)' : 'var(--color-gray)',
                borderBottom: tab === nextTab ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {nextTab === 'all'
                ? 'All Reviews'
                : nextTab === 'flagged'
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Flag size={13} strokeWidth={2.5} />Flagged</span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} strokeWidth={2.5} />Low Score</span>}
              <span
                style={{
                  marginLeft: 8,
                  background: tab === nextTab ? 'var(--color-mint)' : '#F1F5F9',
                  color: tab === nextTab ? 'var(--color-primary)' : 'var(--color-gray)',
                  borderRadius: 99,
                  padding: '2px 8px',
                  fontSize: 12,
                }}
              >
                {nextTab === 'all' ? metrics.total : nextTab === 'flagged' ? metrics.flagged : lowScoreCount}
              </span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
            <input
              placeholder="Search reviews…"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                width: 220,
                outline: 'none',
                color: 'var(--color-navy)',
              }}
            />
          </div>
        </div>

        <div>
          {loading && (
            <div style={{ padding: '8px 24px' }}>
              <table className="data-table">
                <tbody>
                  <SkeletonTableRows count={6} cols={2} />
                </tbody>
              </table>
            </div>
          )}

          {!loading && paged.map((review, index) => (
            <div
              key={review.id}
              style={{
                padding: '20px 24px',
                borderBottom: index < paged.length - 1 ? '1px solid #F8FAFC' : 'none',
                background: review.rating <= 2 ? '#FFF5F5' : review.flagged ? '#FFFBEB' : '#fff',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--color-mint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {review.parentName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-navy)' }}>{review.parentName}</span>
                      {review.flagged ? (
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Flag size={11} strokeWidth={2.5} />Flagged
                        </span>
                      ) : null}
                      {review.rating <= 2 ? (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} strokeWidth={2.5} />Low Score
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 2 }}>
                      re: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{review.teacherName}</span> · {review.activity}
                      {review.bookingId ? ` · ${review.bookingId}` : ''}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <StarRow rating={review.rating} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6, paddingLeft: 48 }}>
                  "{review.comment || 'No written feedback provided.'}"
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 140 }}>
                <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{review.date || '—'}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {review.bookingId ? <Link className="btn btn--ghost btn--sm" href={`/bookings/${review.bookingId}`}>Open Booking</Link> : null}
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={USE_MOCK_DATA || actionKey === `flag-${review.id}`}
                    onClick={() => void runReviewAction(`flag-${review.id}`, async () => {
                      await adminApi.reviews.flag(review.id, { flagged: !review.flagged })
                    })}
                  >
                    {actionKey === `flag-${review.id}` ? 'Updating…' : review.flagged ? 'Unflag' : 'Flag'}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ color: 'var(--color-coral)' }}
                    disabled={USE_MOCK_DATA || actionKey === `escalate-${review.id}`}
                    onClick={() => void runReviewAction(`escalate-${review.id}`, async () => {
                      await adminApi.reviews.escalate(review.id, {
                        issueType: review.rating <= 2 ? 'other' : 'schedule_issue',
                        resolution: review.rating <= 2 ? 'support_only' : 'none',
                        description: review.comment,
                      })
                    })}
                  >
                    {actionKey === `escalate-${review.id}` ? 'Escalating…' : 'Escalate'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && paged.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-gray)' }}>
              No reviews match this queue.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="pagination" style={{ borderTop: '1px solid #F1F5F9', padding: '12px 24px' }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((nextPage) => (
              <button key={nextPage} className={`page-btn${page === nextPage ? ' page-btn--active' : ''}`} onClick={() => setPage(nextPage)}>{nextPage}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Next →</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
