'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { formatInr } from '@/lib/formatters'
import { adminApi } from '@/lib/api'
import { SkeletonLine, SkeletonTableRows } from '@/components/Skeleton'

type UserStatus = 'active' | 'inactive' | 'suspended'

type UserDetail = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  joinDate: string
  lastActive: string
  status: UserStatus
  totalBookings: number
  totalSpend: number
  children: { name: string; age: number; skills: string[] }[]
}

type Booking = {
  id: string
  activity: string
  teacherName: string
  date: string
  amount: number
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending'
}

const MOCK_USER: UserDetail = {
  id: 'U001',
  name: 'Priya Sharma',
  email: 'priya.sharma@gmail.com',
  phone: '+91 98765 43210',
  city: 'Mumbai',
  joinDate: '12 Mar 2024',
  lastActive: '7 May 2024',
  status: 'active',
  totalBookings: 14,
  totalSpend: 7450,
  children: [
    { name: 'Aarav Sharma', age: 6, skills: ['Dance', 'Art'] },
    { name: 'Mia Sharma', age: 4, skills: ['Music'] },
  ],
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'BK001', activity: 'Yoga for Kids', teacherName: 'Arjun Kapoor', date: '8 May 2024, 10:00 AM', amount: 350, status: 'confirmed' },
  { id: 'BK002', activity: 'Watercolor Painting', teacherName: 'Sneha Patel', date: '3 May 2024, 3:00 PM', amount: 400, status: 'completed' },
  { id: 'BK003', activity: 'Science Experiments', teacherName: 'Kiran Kumar', date: '9 May 2024, 3:30 PM', amount: 500, status: 'confirmed' },
  { id: 'BK004', activity: 'Bharatanatyam', teacherName: 'Ananya Reddy', date: '28 Apr 2024, 4:00 PM', amount: 600, status: 'completed' },
  { id: 'BK005', activity: 'Chess Basics', teacherName: 'Gaurav Tiwari', date: '20 Apr 2024, 5:00 PM', amount: 400, status: 'cancelled' },
]

const STATUS_BADGE: Record<UserStatus, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'badge badge--confirmed' },
  inactive:  { label: 'Inactive',  cls: 'badge badge--cancelled' },
  suspended: { label: 'Suspended', cls: 'badge badge--pending' },
}

const BOOKING_BADGE: Record<Booking['status'], string> = {
  confirmed: 'badge--confirmed',
  completed: 'badge--completed',
  cancelled: 'badge--cancelled',
  pending:   'badge--pending',
}

export default function UserDetailPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const params = useParams()
  const [suspendAction, setSuspendAction] = useState<'idle' | 'confirming' | 'done'>('idle')
  const [liveUser, setLiveUser] = useState<UserDetail | null>(null)
  const [liveBookings, setLiveBookings] = useState<Booking[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    const id = params.id as string
    void (async () => {
      try {
        const data = await adminApi.users.get(id)
        setLiveUser({
          id: data.id,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email ?? '—',
          phone: data.phone ?? '—',
          city: data.city ?? '—',
          joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          lastActive: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          status: 'active',
          totalBookings: data.totalBookings ?? 0,
          totalSpend: data.totalSpend ?? 0,
          children: (data.children ?? []).map((c: any) => {
            const dob = c.dateOfBirth ? new Date(c.dateOfBirth) : null
            const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0
            return { name: `${c.firstName} ${c.lastName ?? ''}`.trim(), age, skills: [] }
          }),
        })
        setLiveBookings((data.recentBookings ?? []).map((b: any) => ({
          id: b.id.slice(0, 8).toUpperCase(),
          activity: b.activityTitle ?? '—',
          teacherName: b.teacherName ?? '—',
          date: b.scheduledAt
            ? new Date(b.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: Number(b.totalAmount),
          status: b.status as Booking['status'],
        })))
      } catch { /* fall back to mock */ }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, params.id])

  const user = USE_MOCK_DATA ? MOCK_USER : (liveUser ?? MOCK_USER)
  const bookings = USE_MOCK_DATA ? MOCK_BOOKINGS : (liveBookings ?? MOCK_BOOKINGS)

  function handleSuspend() {
    // TODO: PATCH /admin/users/:id { status: 'suspended' }
    setSuspendAction('done')
  }

  return (
    <div>
      {/* Back */}
      <div className="detail-header">
        <button className="detail-header__back" onClick={() => router.back()} type="button">
          ← Back to Users
        </button>
      </div>

      {/* Hero */}
      <div className="card" style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {loading
          ? <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
          : <div className="avatar" style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}>
              {user.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
        }
        <div style={{ flex: 1, minWidth: 200 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <SkeletonLine width="45%" height={22} />
              <SkeletonLine width="65%" height={13} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-navy)' }}>{user.name}</h1>
                <span className={STATUS_BADGE[user.status].cls}>{STATUS_BADGE[user.status].label}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>
                {user.email} · {user.phone} · {user.city}
              </p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          {!loading && user.status !== 'suspended' && suspendAction === 'idle' && (
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }} onClick={() => setSuspendAction('confirming')} type="button">
              Suspend Account
            </button>
          )}
          {suspendAction === 'confirming' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--color-gray)', alignSelf: 'center' }}>Confirm suspend?</span>
              <button className="btn btn--danger btn--sm" onClick={handleSuspend} type="button">Yes, Suspend</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setSuspendAction('idle')} type="button">Cancel</button>
            </>
          )}
          {suspendAction === 'done' && (
            <span style={{ fontSize: 12, color: 'var(--color-coral)', fontWeight: 600 }}>✓ Account suspended</span>
          )}
          {user.status === 'suspended' && suspendAction !== 'done' && (
            <button className="btn btn--secondary btn--sm" onClick={() => alert('Restore account coming soon.')} type="button">
              Restore Account
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-3)', alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

          {/* Profile Details */}
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Profile Details</h2>
            {loading ? (
              <div className="info-grid info-grid--3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <SkeletonLine width="45%" height={11} style={{ marginBottom: 6 }} />
                    <SkeletonLine width="70%" height={14} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-grid info-grid--3">
                <div>
                  <p className="info-item__label">Email</p>
                  <p className="info-item__value">{user.email}</p>
                </div>
                <div>
                  <p className="info-item__label">Phone</p>
                  <p className="info-item__value">{user.phone}</p>
                </div>
                <div>
                  <p className="info-item__label">City</p>
                  <p className="info-item__value">{user.city}</p>
                </div>
                <div>
                  <p className="info-item__label">Joined</p>
                  <p className="info-item__value">{user.joinDate}</p>
                </div>
                <div>
                  <p className="info-item__label">Last Active</p>
                  <p className="info-item__value">{user.lastActive}</p>
                </div>
                <div>
                  <p className="info-item__label">Total Bookings</p>
                  <p className="info-item__value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{user.totalBookings}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="card" style={{ padding: 0 }}>
            <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
              <h2 className="section-card__title">Recent Bookings</h2>
              <a href="/bookings" className="section-card__link">View all</a>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Activity</th>
                    <th>Teacher</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <SkeletonTableRows count={4} cols={6} />}
                  {!loading && bookings.map(b => (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/bookings/${b.id}`)}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>{b.id}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{b.activity}</td>
                      <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{b.teacherName}</td>
                      <td><div className="cell-sub">{b.date}</div></td>
                      <td className="cell-mono">{formatInr(b.amount)}</td>
                      <td><span className={`badge ${BOOKING_BADGE[b.status]}`} style={{ textTransform: 'capitalize' }}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

          {/* Stats */}
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Account Stats</h2>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <SkeletonLine width="45%" height={12} />
                  <SkeletonLine width="25%" height={15} />
                </div>
              ))
            ) : (
              [
                { label: 'Total Bookings', value: user.totalBookings, mono: true },
                { label: 'Total Spend', value: formatInr(user.totalSpend), mono: true },
                { label: 'Children', value: user.children.length, mono: true },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--color-navy)' }}>{s.value}</span>
                </div>
              ))
            )}
          </div>

          {/* Children */}
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Children</h2>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <SkeletonLine width="55%" height={13} style={{ marginBottom: 6 }} />
                    <SkeletonLine width="35%" height={12} />
                  </div>
                </div>
              ))
            ) : user.children.map((child, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < user.children.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                  {child.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 4 }}>{child.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-gray)', marginBottom: 4 }}>Age {child.age} years</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {child.skills.map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
