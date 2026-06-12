'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { useRouter } from 'next/navigation'
import { GraduationCap, BadgeCheck, Clock, Star, AlertTriangle } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { TEACHER_VERIFY_BADGE, TEACHER_STATUS_BADGE } from '@/lib/status-badges'

type VerificationStatus = 'verified' | 'pending' | 'rejected'
type TeacherStatus = 'active' | 'inactive' | 'suspended'

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  city: string
  specializations: string[]
  rating: number
  sessionsCompleted: number
  verificationStatus: VerificationStatus
  status: TeacherStatus
  joinDate: string
  lastSession: string
  totalEarnings: number
}

const MOCK_TEACHERS: Teacher[] = [
  { id: 'T001', name: 'Arjun Kapoor', email: 'arjun.k@beam.in', phone: '+91 98765 11111', city: 'Mumbai', specializations: ['Yoga', 'Dance'], rating: 4.9, sessionsCompleted: 142, verificationStatus: 'verified', status: 'active', joinDate: '2023-08-01', lastSession: '2024-05-07', totalEarnings: 142000 },
  { id: 'T002', name: 'Sneha Patel', email: 'sneha.p@beam.in', phone: '+91 87654 22222', city: 'Delhi', specializations: ['Art', 'Craft'], rating: 4.7, sessionsCompleted: 98, verificationStatus: 'verified', status: 'active', joinDate: '2023-09-15', lastSession: '2024-05-06', totalEarnings: 98000 },
  { id: 'T003', name: 'Ravi Shankar', email: 'ravi.s@beam.in', phone: '+91 76543 33333', city: 'Bangalore', specializations: ['Music', 'Guitar'], rating: 4.8, sessionsCompleted: 213, verificationStatus: 'verified', status: 'active', joinDate: '2023-06-10', lastSession: '2024-05-07', totalEarnings: 213000 },
  { id: 'T004', name: 'Meera Joshi', email: 'meera.j@beam.in', phone: '+91 65432 44444', city: 'Pune', specializations: ['Cooking', 'Baking'], rating: 4.6, sessionsCompleted: 67, verificationStatus: 'verified', status: 'active', joinDate: '2024-01-20', lastSession: '2024-05-05', totalEarnings: 67000 },
  { id: 'T005', name: 'Kiran Kumar', email: 'kiran.k@beam.in', phone: '+91 54321 55555', city: 'Hyderabad', specializations: ['Coding', 'Robotics'], rating: 4.5, sessionsCompleted: 45, verificationStatus: 'pending', status: 'active', joinDate: '2024-04-01', lastSession: '2024-05-03', totalEarnings: 45000 },
  { id: 'T006', name: 'Ananya Reddy', email: 'ananya.r@beam.in', phone: '+91 43210 66666', city: 'Chennai', specializations: ['Dance', 'Theatre'], rating: 4.8, sessionsCompleted: 178, verificationStatus: 'verified', status: 'active', joinDate: '2023-07-22', lastSession: '2024-05-06', totalEarnings: 178000 },
  { id: 'T007', name: 'Rohit Sharma', email: 'rohit.s@beam.in', phone: '+91 32109 77777', city: 'Jaipur', specializations: ['Cricket', 'Fitness'], rating: 3.9, sessionsCompleted: 22, verificationStatus: 'rejected', status: 'suspended', joinDate: '2024-03-10', lastSession: '2024-04-01', totalEarnings: 22000 },
  { id: 'T008', name: 'Divya Menon', email: 'divya.m@beam.in', phone: '+91 21098 88888', city: 'Kochi', specializations: ['Kathakali', 'Classical Dance'], rating: 4.9, sessionsCompleted: 301, verificationStatus: 'verified', status: 'active', joinDate: '2023-04-05', lastSession: '2024-05-07', totalEarnings: 301000 },
  { id: 'T009', name: 'Sameer Malhotra', email: 'sameer.m@beam.in', phone: '+91 10987 99999', city: 'Mumbai', specializations: ['Swimming', 'Football'], rating: 4.3, sessionsCompleted: 55, verificationStatus: 'pending', status: 'active', joinDate: '2024-02-14', lastSession: '2024-05-02', totalEarnings: 55000 },
  { id: 'T010', name: 'Preethi Subramaniam', email: 'preethi.s@beam.in', phone: '+91 99876 00000', city: 'Bangalore', specializations: ['Carnatic Music', 'Veena'], rating: 5.0, sessionsCompleted: 89, verificationStatus: 'verified', status: 'active', joinDate: '2023-11-01', lastSession: '2024-05-07', totalEarnings: 89000 },
  { id: 'T011', name: 'Gaurav Tiwari', email: 'gaurav.t@beam.in', phone: '+91 88765 11100', city: 'Delhi', specializations: ['Chess', 'Maths'], rating: 4.7, sessionsCompleted: 120, verificationStatus: 'verified', status: 'active', joinDate: '2023-10-08', lastSession: '2024-05-05', totalEarnings: 120000 },
  { id: 'T012', name: 'Vandana Singh', email: 'vandana.s@beam.in', phone: '+91 77654 22200', city: 'Ahmedabad', specializations: ['Pottery', 'Art'], rating: 4.4, sessionsCompleted: 33, verificationStatus: 'pending', status: 'inactive', joinDate: '2024-04-22', lastSession: '2024-04-28', totalEarnings: 33000 },
]

const CITIES = ['All Cities', ...Array.from(new Set(MOCK_TEACHERS.map(t => t.city))).sort()]
const PAGE_SIZE = 10

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--color-yellow)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))} {rating.toFixed(1)}
    </span>
  )
}

type InviteForm = { firstName: string; lastName: string; email: string; phone: string; city: string; bio: string; specializations: string }
const INVITE_INITIAL: InviteForm = { firstName: '', lastName: '', email: '', phone: '', city: '', bio: '', specializations: '' }

export default function TeachersPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [verify, setVerify]     = useState('all')
  const [city, setCity]         = useState('All Cities')
  const [page, setPage]         = useState(1)
  const [liveTeachers, setLiveTeachers] = useState<typeof MOCK_TEACHERS | null>(null)
  const [loading, setLoading] = useState(false)
  const [showInvite, setShowInvite]     = useState(false)
  const [invite, setInvite]             = useState<InviteForm>(INVITE_INITIAL)
  const [inviting, setInviting]         = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    try {
      await adminApi.teachers.create({
        ...invite,
        specializations: invite.specializations,
      })
      setShowInvite(false)
      setInvite(INVITE_INITIAL)
      setLiveTeachers(null)
    } catch (err: any) {
      setInviteError(err?.message?.includes('409') || err?.message?.includes('already')
        ? 'A teacher with this email already exists.'
        : 'Failed to invite teacher. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  function setInviteField(field: keyof InviteForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInvite(f => ({ ...f, [field]: e.target.value }))
  }

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    void (async () => {
      try {
        const data = await adminApi.teachers.list({
          status: verify === 'all' ? undefined : verify,
          search: search || undefined,
        })
        setLiveTeachers(data.items.map((t: any) => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`.trim(),
          email: t.email,
          phone: t.phone ?? '—',
          city: t.city ?? '—',
          specializations: t.specializations ?? [],
          verificationStatus: t.verificationStatus as VerificationStatus,
          rating: Number(t.rating ?? 0),
          reviewCount: t.reviewCount ?? 0,
          sessions: 0,
          sessionsCompleted: t.reviewCount ?? 0,
          earnings: 0,
          totalEarnings: 0,
          joinedAt: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          joinDate: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '—',
          lastSession: '—',
          status: 'active' as TeacherStatus,
        })))
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, verify, search])

  const activeTeachers = USE_MOCK_DATA ? MOCK_TEACHERS : (liveTeachers ?? MOCK_TEACHERS)

  const filtered = useMemo(() => {
    return activeTeachers.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
      const matchVerify = verify === 'all' || t.verificationStatus === verify
      const matchCity   = city === 'All Cities' || t.city === city
      return matchSearch && matchVerify && matchCity
    })
  }, [activeTeachers, search, verify, city])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pendingCount = activeTeachers.filter(t => t.verificationStatus === 'pending').length

  function exportCsv() {
    const header = ['Name', 'Email', 'Phone', 'City', 'Status', 'Rating', 'Sessions']
    const lines = [
      header.join(','),
      ...filtered.map(t => [t.name, t.email, t.phone, t.city, t.verificationStatus, t.rating, t.sessionsCompleted].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teachers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title="Teachers" subtitle="Verification pipeline and quality monitoring">
        <button className="btn btn--secondary btn--sm" onClick={exportCsv}>Export CSV</button>
        <button className="btn btn--primary btn--sm" onClick={() => setShowInvite(true)}>+ Invite Teacher</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live teacher data is unavailable. Showing demo teachers; invite and verification work needs the API." />}

      {/* Pending verification alert */}
      {pendingCount > 0 && (
        <div className="alert-strip" style={{ marginBottom: 16 }}>
          <div className="alert-strip__item alert-strip__item--amber">
            <div className="alert-strip__icon">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>
            <div className="alert-strip__body">
              <p className="alert-strip__text">
                <strong>{pendingCount} teacher{pendingCount > 1 ? 's' : ''} awaiting verification review.</strong>
              </p>
            </div>
            <button className="alert-strip__btn" onClick={() => router.push('/teachers/verification')}>Review Now</button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Teachers', value: activeTeachers.length, delta: '+3 this month', up: true, Icon: GraduationCap, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Verified', value: activeTeachers.filter(t => t.verificationStatus === 'verified').length, delta: 'Active on platform', up: true, Icon: BadgeCheck, iconBg: '#DCFCE7', iconColor: '#16A34A' },
            { label: 'Pending Verification', value: pendingCount, delta: 'Needs review', up: false, Icon: Clock, iconBg: '#FEF3C7', iconColor: '#B45309' },
            { label: 'Avg Rating', value: activeTeachers.length > 0 ? `${(activeTeachers.reduce((s, t) => s + t.rating, 0) / activeTeachers.length).toFixed(1)}` : '—', delta: '↑ 0.2 this month', up: true, Icon: Star, iconBg: '#FEF3C7', iconColor: '#FCB857' },
          ].map(k => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Filter + Table */}
      <div className="table-card">
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder="Search teacher name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={verify} onChange={e => { setVerify(e.target.value); setPage(1) }}>
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="filter-bar__select" value={city} onChange={e => { setCity(e.target.value); setPage(1) }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} teachers</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Specializations</th>
                <th>City</th>
                <th>Rating</th>
                <th>Sessions</th>
                <th>Earnings</th>
                <th>Joined</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows count={8} cols={10} />}
              {!loading && paged.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--color-mint)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0
                      }}>
                        {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {t.specializations.map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{t.city}</td>
                  <td><Stars rating={t.rating} /></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.sessionsCompleted}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    ₹{t.totalEarnings.toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{t.joinDate}</td>
                  <td><span className={TEACHER_VERIFY_BADGE[t.verificationStatus].cls}>{TEACHER_VERIFY_BADGE[t.verificationStatus].label}</span></td>
                  <td><span className={TEACHER_STATUS_BADGE[t.status].cls}>{TEACHER_STATUS_BADGE[t.status].label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/teachers/${t.id}`)}>View</button>
                      {t.verificationStatus === 'pending' && (
                        <button className="btn btn--sm" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }} onClick={() => router.push(`/teachers/${t.id}`)}>
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paged.length === 0 && (
                <tr><td colSpan={10} className="empty-state">No teachers match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {/* Invite Teacher Modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-navy)' }}>Invite Teacher</h2>
              <button onClick={() => { setShowInvite(false); setInvite(INVITE_INITIAL); setInviteError(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-gray)' }}>✕</button>
            </div>

            {inviteError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input className="form-input" required value={invite.firstName} onChange={setInviteField('firstName')} placeholder="Arjun" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" required value={invite.lastName} onChange={setInviteField('lastName')} placeholder="Kapoor" />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={invite.email} onChange={setInviteField('email')} placeholder="arjun@example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={invite.phone} onChange={setInviteField('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input className="form-input" value={invite.city} onChange={setInviteField('city')} placeholder="Mumbai" />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Specializations <span style={{ fontWeight: 400, color: '#64748B' }}>(comma-separated)</span></label>
                <input className="form-input" value={invite.specializations} onChange={setInviteField('specializations')} placeholder="Dance, Yoga, Music" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Bio</label>
                <textarea className="form-input" style={{ height: 80, resize: 'vertical' }} value={invite.bio} onChange={setInviteField('bio')} placeholder="Brief background about the teacher…" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setShowInvite(false); setInvite(INVITE_INITIAL); setInviteError(null) }}>Cancel</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={inviting}>
                  {inviting ? 'Inviting…' : 'Invite Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
