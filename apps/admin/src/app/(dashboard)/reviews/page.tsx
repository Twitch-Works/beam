'use client'

import { useState, useMemo } from 'react'
import { Flag, AlertTriangle, Star, MessageSquare } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'

// TODO: replace with useReviews() hook from @beam/hooks/admin
// import { useReviews } from '@beam/hooks/admin'

interface Review {
  id: string
  bookingId: string
  parentName: string
  childName: string
  teacherName: string
  activity: string
  rating: number
  comment: string
  flagged: boolean
  date: string
}

const MOCK_REVIEWS: Review[] = [
  { id: 'RV001', bookingId: 'BK003', parentName: 'Anita Patel', childName: 'Karan Patel', teacherName: 'Ananya Reddy', activity: 'Bharatanatyam', rating: 5, comment: 'Absolutely wonderful session! Ananya is so patient and engaging. Karan loved every minute.', flagged: false, date: '2024-05-07' },
  { id: 'RV002', bookingId: 'BK006', parentName: 'Nisha Agarwal', childName: 'Zara Agarwal', teacherName: 'Preethi Subramaniam', activity: 'Carnatic Vocal', rating: 5, comment: 'Preethi has a wonderful teaching style. Zara is already humming the swaras!', flagged: false, date: '2024-05-06' },
  { id: 'RV003', bookingId: 'BK011', parentName: 'Pooja Iyer', childName: 'Ishaan Iyer', teacherName: 'Ananya Reddy', activity: 'Bharatanatyam', rating: 4, comment: 'Great session overall. A bit rushed at the end, but Ishaan learned a lot.', flagged: false, date: '2024-05-05' },
  { id: 'RV004', bookingId: 'BK016', parentName: 'Meena Gupta', childName: 'Ravi Gupta', teacherName: 'Gaurav Tiwari', activity: 'Chess Basics', rating: 5, comment: 'Gaurav explains chess concepts so clearly even for a 7-year-old. Highly recommend!', flagged: false, date: '2024-05-04' },
  { id: 'RV005', bookingId: 'BK017', parentName: 'Nisha Agarwal', childName: 'Kia Agarwal', teacherName: 'Arjun Kapoor', activity: 'Yoga for Kids', rating: 5, comment: 'Perfect energy for young children. Kia is asking for more sessions!', flagged: false, date: '2024-05-07' },
  { id: 'RV006', bookingId: 'BK007', parentName: 'Deepa Krishnan', childName: 'Dev Krishnan', teacherName: 'Gaurav Tiwari', activity: 'Chess Basics', rating: 2, comment: 'Teacher was 20 minutes late and seemed distracted. Very disappointing.', flagged: true, date: '2024-05-06' },
  { id: 'RV007', bookingId: 'BK009', parentName: 'Lakshmi Rao', childName: 'Aditi Rao', teacherName: 'Sneha Patel', activity: 'Watercolor Painting', rating: 3, comment: 'Decent class but expected more structured learning. Materials not prepared well.', flagged: false, date: '2024-05-04' },
  { id: 'RV008', bookingId: 'BK031', parentName: 'Meena Gupta', childName: 'Sia Gupta', teacherName: 'Arjun Kapoor', activity: 'Yoga for Kids', rating: 1, comment: 'Teacher was rude and impatient. My child cried after the session. Completely unacceptable.', flagged: true, date: '2024-05-06' },
  { id: 'RV009', bookingId: 'BK040', parentName: 'Pooja Iyer', childName: 'Ishaan Iyer', teacherName: 'Meera Joshi', activity: 'Cooking Adventures', rating: 4, comment: 'Fun and safe session. Meera is creative with recipes for kids. Will book again.', flagged: false, date: '2024-05-05' },
  { id: 'RV010', bookingId: 'BK010', parentName: 'Sanjay Joshi', childName: 'Veer Joshi', teacherName: 'Meera Joshi', activity: 'Cooking Adventures', rating: 5, comment: 'Best cooking class for kids. Veer made a proper dish from scratch!', flagged: false, date: '2024-05-07' },
  { id: 'RV011', bookingId: 'BK015', parentName: 'Kavya Nair', childName: 'Arya Nair', teacherName: 'Divya Menon', activity: 'Kathakali Dance', rating: 5, comment: 'Divya is a legend. The authenticity and grace she brings is unmatched.', flagged: false, date: '2024-05-07' },
  { id: 'RV012', bookingId: 'BK025', parentName: 'Sanjay Joshi', childName: 'Veer Joshi', teacherName: 'Ravi Shankar', activity: 'Guitar Lessons', rating: 2, comment: 'Session was cut short. Teacher had to leave early. No compensation offered.', flagged: true, date: '2024-05-02' },
  { id: 'RV013', bookingId: 'BK042', parentName: 'Rajesh Kumar', childName: 'Kabir Kumar', teacherName: 'Sameer Malhotra', activity: 'English Communication', rating: 4, comment: 'Engaging teaching approach. Kabir is more confident speaking already.', flagged: false, date: '2024-05-05' },
  { id: 'RV014', bookingId: 'BK013', parentName: 'Priya Sharma', childName: 'Mia Sharma', teacherName: 'Kiran Kumar', activity: 'Science Experiments', rating: 5, comment: 'Mind-blowing experiments! Mia went to sleep talking about photosynthesis. 10/10.', flagged: false, date: '2024-05-07' },
  { id: 'RV015', bookingId: 'BK044', parentName: 'Suresh Reddy', childName: 'Nik Reddy', teacherName: 'Gaurav Tiwari', activity: 'Chess Basics', rating: 3, comment: 'Average session. Teacher was okay but not enthusiastic. Room for improvement.', flagged: false, date: '2024-05-03' },
]

const PAGE_SIZE = 10

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: 14, color: s <= rating ? 'var(--color-yellow)' : '#E2E8F0' }}>★</span>
      ))}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)', marginLeft: 4 }}>{rating}.0</span>
    </div>
  )
}

export default function ReviewsPage() {
  const [tab, setTab]         = useState<'all' | 'flagged' | 'low'>('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  // TODO: replace mock with -> const { data, isLoading } = useReviews({ tab, search, page })

  const base = useMemo(() => {
    if (tab === 'flagged') return MOCK_REVIEWS.filter(r => r.flagged)
    if (tab === 'low')     return MOCK_REVIEWS.filter(r => r.rating <= 2)
    return MOCK_REVIEWS
  }, [tab])

  const filtered = useMemo(() => {
    if (!search) return base
    return base.filter(r =>
      r.parentName.toLowerCase().includes(search.toLowerCase()) ||
      r.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      r.activity.toLowerCase().includes(search.toLowerCase())
    )
  }, [base, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1)

  return (
    <div>
      {/* Header */}
      <PageHeader title="Reviews & Feedback" subtitle="Parent ratings, quality flags, and low-score triage">
        {/* TODO: POST /api/admin/reviews/export */}
        <button className="btn btn--secondary btn--sm">Export CSV</button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Total Reviews', value: MOCK_REVIEWS.length, delta: '+6 this week', up: true, Icon: MessageSquare, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Average Rating', value: avgRating, delta: 'Platform-wide', up: true, Icon: Star, iconBg: '#FEF3C7', iconColor: '#FCB857' },
          { label: 'Flagged Reviews', value: MOCK_REVIEWS.filter(r => r.flagged).length, delta: 'Need admin action', up: false, Icon: Flag, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Low Score (≤2★)', value: MOCK_REVIEWS.filter(r => r.rating <= 2).length, delta: 'Intervention queue', up: false, Icon: AlertTriangle, iconBg: '#FEE2E2', iconColor: '#DC2626' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Tabs + Table */}
      <div className="table-card">
        {/* Tab Row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 24px' }}>
          {(['all', 'flagged', 'low'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1) }}
              style={{
                background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                color: tab === t ? 'var(--color-primary)' : 'var(--color-gray)',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1
              }}
            >
              {t === 'all' ? 'All Reviews' : t === 'flagged'
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Flag size={13} strokeWidth={2.5} />Flagged</span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} strokeWidth={2.5} />Low Score</span>
              }
              <span style={{
                marginLeft: 8, background: tab === t ? 'var(--color-mint)' : '#F1F5F9',
                color: tab === t ? 'var(--color-primary)' : 'var(--color-gray)',
                borderRadius: 99, padding: '2px 8px', fontSize: 12
              }}>
                {t === 'all' ? MOCK_REVIEWS.length : t === 'flagged' ? MOCK_REVIEWS.filter(r => r.flagged).length : MOCK_REVIEWS.filter(r => r.rating <= 2).length}
              </span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
            <input
              placeholder="Search reviews…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px',
                fontSize: 13, width: 220, outline: 'none', color: 'var(--color-navy)'
              }}
            />
          </div>
        </div>

        {/* Review Rows */}
        <div>
          {paged.map((r, i) => (
            <div
              key={r.id}
              style={{
                padding: '20px 24px', borderBottom: i < paged.length - 1 ? '1px solid #F8FAFC' : 'none',
                background: r.rating <= 2 ? '#FFF5F5' : r.flagged ? '#FFFBEB' : '#fff',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start'
              }}
            >
              <div>
                {/* Review header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--color-mint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0
                  }}>
                    {r.parentName.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-navy)' }}>{r.parentName}</span>
                      {r.flagged && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Flag size={11} strokeWidth={2.5} />Flagged
                        </span>
                      )}
                      {r.rating <= 2 && (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} strokeWidth={2.5} />Low Score
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 2 }}>
                      re: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{r.teacherName}</span> · {r.activity} · {r.childName}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <StarRow rating={r.rating} />
                  </div>
                </div>
                {/* Comment */}
                <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6, paddingLeft: 48 }}>
                  "{r.comment}"
                </p>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 140 }}>
                <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{r.date}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* TODO: POST /api/admin/reviews/:id/flag */}
                  {!r.flagged
                    ? <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-gray)' }}>Flag</button>
                    : <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }}>Unflag</button>
                  }
                  {/* TODO: DELETE /api/admin/reviews/:id */}
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }}>Remove</button>
                </div>
              </div>
            </div>
          ))}

          {paged.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-gray)' }}>
              No reviews in this category yet.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ borderTop: '1px solid #F1F5F9', padding: '12px 24px' }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
