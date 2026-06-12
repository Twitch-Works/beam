'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatInr } from '@/lib/formatters'

// TODO: replace with useTeacher(id) hook from @beam/hooks/admin
type Teacher = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  joinDate: string
  verificationStatus: 'verified' | 'pending' | 'rejected'
  rating: number
  totalSessions: number
  totalEarnings: number
  pendingPayout: number
  thisMonthEarnings: number
  specialties: string[]
  documents: { idProof: boolean; certificate: boolean; policeCheck: boolean }
  bio: string
}

type Session = {
  id: string
  date: string
  childName: string
  activity: string
  duration: string
  amount: number
  status: 'completed' | 'upcoming' | 'cancelled'
}

const mockTeacher: Teacher = {
  id: 'T-001',
  name: 'Ms. Priya Sharma',
  email: 'priya.sharma@gmail.com',
  phone: '+91 98765 43210',
  city: 'Mumbai',
  joinDate: '12 Jan 2024',
  verificationStatus: 'verified',
  rating: 4.9,
  totalSessions: 128,
  totalEarnings: 94800,
  pendingPayout: 12400,
  thisMonthEarnings: 18200,
  specialties: ['Messy Play', 'Art & Craft', 'Sensory Play', 'Storytelling'],
  documents: { idProof: true, certificate: true, policeCheck: true },
  bio: 'Experienced early childhood educator with 6 years of experience working with children aged 2–8. Certified Montessori practitioner passionate about play-based learning.',
}

const mockSessions: Session[] = [
  { id: 'S-2401', date: '15 May 2026, 4:00 PM', childName: 'Aarav Mehta', activity: 'Messy Play Session', duration: '60 min', amount: 649, status: 'completed' },
  { id: 'S-2398', date: '14 May 2026, 5:30 PM', childName: 'Ishita Gupta', activity: 'Storytelling Circle', duration: '45 min', amount: 599, status: 'completed' },
  { id: 'S-2391', date: '13 May 2026, 11:00 AM', childName: 'Vihaan Nair', activity: 'Art & Craft', duration: '60 min', amount: 649, status: 'completed' },
  { id: 'S-2388', date: '11 May 2026, 4:00 PM', childName: 'Ananya Rao', activity: 'Sensory Play', duration: '60 min', amount: 649, status: 'completed' },
  { id: 'S-2412', date: '17 May 2026, 3:00 PM', childName: 'Reyansh Pillai', activity: 'Messy Play Session', duration: '60 min', amount: 649, status: 'upcoming' },
]

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: 'var(--color-yellow)', fontSize: 14 }}>★</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function DocCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: ok ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
        color: ok ? 'var(--color-success)' : 'var(--color-error)', fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {ok ? '✓' : '✗'}
      </span>
      <span style={{ fontSize: 13, color: ok ? 'var(--color-navy)' : 'var(--color-gray)' }}>{label}</span>
    </div>
  )
}

export default function TeacherDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [verifyAction, setVerifyAction] = useState<'idle' | 'confirming-approve' | 'confirming-reject' | 'done'>('idle')

  // TODO: fetch real teacher — const { data: teacher } = useTeacher(params.id as string)
  const teacher = mockTeacher

  const statusClass = teacher.verificationStatus === 'verified' ? 'badge--verified'
    : teacher.verificationStatus === 'pending' ? 'badge--pending' : 'badge--suspended'

  function handleApprove() {
    // TODO: PATCH /api/teachers/:id/verify { status: 'verified' }
    setVerifyAction('done')
  }
  function handleReject() {
    // TODO: PATCH /api/teachers/:id/verify { status: 'rejected' }
    setVerifyAction('done')
  }

  return (
    <div>
      {/* Back + header */}
      <div className="detail-header">
        <button className="detail-header__back" onClick={() => router.back()} type="button">
          ← Back to Teachers
        </button>
      </div>

      {/* Teacher hero */}
      <div className="card" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}>
          {teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-navy)' }}>{teacher.name}</h1>
            <span className={`badge ${statusClass}`} style={{ textTransform: 'capitalize' }}>{teacher.verificationStatus}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-gray)', marginBottom: 8 }}>{teacher.email} · {teacher.phone} · {teacher.city}</p>
          <p style={{ fontSize: 13, color: 'var(--color-navy)', lineHeight: 1.6, maxWidth: 600 }}>{teacher.bio}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          {teacher.verificationStatus === 'pending' && verifyAction === 'idle' && (
            <>
              <button className="btn btn--primary btn--sm" onClick={() => setVerifyAction('confirming-approve')} type="button">Approve</button>
              <button className="btn btn--danger btn--sm" onClick={() => setVerifyAction('confirming-reject')} type="button">Reject</button>
            </>
          )}
          {verifyAction === 'confirming-approve' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--color-gray)', alignSelf: 'center' }}>Confirm approve?</span>
              <button className="btn btn--primary btn--sm" onClick={handleApprove} type="button">Yes, Approve</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setVerifyAction('idle')} type="button">Cancel</button>
            </>
          )}
          {verifyAction === 'confirming-reject' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--color-gray)', alignSelf: 'center' }}>Confirm reject?</span>
              <button className="btn btn--danger btn--sm" onClick={handleReject} type="button">Yes, Reject</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setVerifyAction('idle')} type="button">Cancel</button>
            </>
          )}
          {verifyAction === 'done' && (
            <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>✓ Action recorded</span>
          )}
          <button className="btn btn--ghost btn--sm" type="button">Send Message</button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-3)', alignItems: 'start' }}>

        {/* Left — info + sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Profile Details</h2>
            <div className="info-grid info-grid--3">
              <div>
                <p className="info-item__label">Email</p>
                <p className="info-item__value">{teacher.email}</p>
              </div>
              <div>
                <p className="info-item__label">Phone</p>
                <p className="info-item__value">{teacher.phone}</p>
              </div>
              <div>
                <p className="info-item__label">City</p>
                <p className="info-item__value">{teacher.city}</p>
              </div>
              <div>
                <p className="info-item__label">Joined</p>
                <p className="info-item__value">{teacher.joinDate}</p>
              </div>
              <div>
                <p className="info-item__label">Avg Rating</p>
                <p className="info-item__value"><StarDisplay rating={teacher.rating} /></p>
              </div>
              <div>
                <p className="info-item__label">Total Sessions</p>
                <p className="info-item__value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{teacher.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
              <h2 className="section-card__title">Recent Sessions</h2>
              <a href="/bookings" className="section-card__link">View all</a>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Child</th>
                    <th>Activity</th>
                    <th>Duration</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)' }}>{s.id}</td>
                      <td>
                        <div>
                          <div style={{ fontSize: 13 }}>{s.childName}</div>
                          <div className="cell-sub">{s.date}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{s.activity}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{s.duration}</td>
                      <td className="cell-mono">{formatInr(s.amount)}</td>
                      <td><span className={`badge badge--${s.status}`} style={{ textTransform: 'capitalize' }}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — earnings + specialties + documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Earnings</h2>
            {[
              { label: 'This Month', value: teacher.thisMonthEarnings, tone: 'teal' },
              { label: 'Pending Payout', value: teacher.pendingPayout, tone: 'yellow' },
              { label: 'Total Earned', value: teacher.totalEarnings, tone: 'green' },
            ].map(e => (
              <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{e.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--color-navy)' }}>{formatInr(e.value)}</span>
              </div>
            ))}
            <button className="btn btn--secondary btn--sm" style={{ width: '100%', marginTop: 'var(--space-4)', justifyContent: 'center' }} type="button">
              View Payouts
            </button>
          </div>

          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Specialties</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teacher.specialties.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>

          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Documents</h2>
            <DocCheck ok={teacher.documents.idProof} label="Government ID Proof" />
            <DocCheck ok={teacher.documents.certificate} label="Teaching Certificate" />
            <DocCheck ok={teacher.documents.policeCheck} label="Police Verification" />
          </div>
        </div>
      </div>
    </div>
  )
}
