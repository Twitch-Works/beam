'use client'

import { useState, useMemo } from 'react'
import { Activity, CalendarDays, Shield, ShieldCheck } from 'lucide-react'

// TODO: replace with useAuditLogs() from @beam/hooks/admin

type ActionType = 'booking' | 'payment' | 'user' | 'teacher' | 'activity' | 'system' | 'auth'

interface AuditEntry {
  id: string
  actor: string
  actorRole: 'admin' | 'super_admin'
  action: string
  actionType: ActionType
  targetId: string
  targetType: string
  details: string
  ip: string
  timestamp: string
}

const MOCK_LOGS: AuditEntry[] = [
  { id: 'AL001', actor: 'Admin User', actorRole: 'super_admin', action: 'PAYOUT_DISPATCHED', actionType: 'payment', targetId: 'PO001', targetType: 'Payout', details: 'Dispatched ₹8,400 payout to Arjun Kapoor (HDFC ****4521)', ip: '103.x.x.10', timestamp: '2024-05-07 15:42:11' },
  { id: 'AL002', actor: 'Admin User', actorRole: 'admin', action: 'TEACHER_VERIFIED', actionType: 'teacher', targetId: 'T001', targetType: 'Teacher', details: 'Verified teacher Arjun Kapoor (ID: T001)', ip: '103.x.x.10', timestamp: '2024-05-07 14:30:05' },
  { id: 'AL003', actor: 'Admin User', actorRole: 'admin', action: 'BOOKING_TEACHER_ASSIGNED', actionType: 'booking', targetId: 'BK005', targetType: 'Booking', details: 'Assigned Kiran Kumar to booking BK005 (Scratch Coding - Vikram Singh)', ip: '103.x.x.10', timestamp: '2024-05-07 13:15:22' },
  { id: 'AL004', actor: 'Admin User', actorRole: 'admin', action: 'DISPUTE_RESOLVED', actionType: 'payment', targetId: 'DSP004', targetType: 'Dispute', details: 'Resolved DSP004 (billing error). Refund of ₹150 processed.', ip: '103.x.x.10', timestamp: '2024-05-07 12:00:44' },
  { id: 'AL005', actor: 'Admin User', actorRole: 'admin', action: 'BOOKING_CANCELLED', actionType: 'booking', targetId: 'BK007', targetType: 'Booking', details: 'Admin cancelled BK007 (Deepa Krishnan - Chess). No-show confirmed.', ip: '103.x.x.10', timestamp: '2024-05-07 11:30:08' },
  { id: 'AL006', actor: 'Super Admin', actorRole: 'super_admin', action: 'FEATURE_FLAG_UPDATED', actionType: 'system', targetId: 'ai_recommendations', targetType: 'Feature Flag', details: 'Enabled ai_recommendations flag', ip: '103.x.x.20', timestamp: '2024-05-07 10:45:33' },
  { id: 'AL007', actor: 'Admin User', actorRole: 'admin', action: 'REVIEW_FLAGGED', actionType: 'user', targetId: 'RV008', targetType: 'Review', details: 'Flagged review RV008 (Meena Gupta, 1★). Review contains safety concern.', ip: '103.x.x.10', timestamp: '2024-05-07 10:12:17' },
  { id: 'AL008', actor: 'Admin User', actorRole: 'admin', action: 'COUPON_CREATED', actionType: 'system', targetId: 'C004', targetType: 'Coupon', details: 'Created coupon YOGA150 (₹150 flat, ₹350 min, expires May 31)', ip: '103.x.x.10', timestamp: '2024-05-07 09:55:01' },
  { id: 'AL009', actor: 'Admin User', actorRole: 'admin', action: 'ACTIVITY_PUBLISHED', actionType: 'activity', targetId: 'ACT006', targetType: 'Activity', details: 'Published activity: Carnatic Vocal Training (ID: ACT006)', ip: '103.x.x.10', timestamp: '2024-05-06 17:30:09' },
  { id: 'AL010', actor: 'Super Admin', actorRole: 'super_admin', action: 'PLATFORM_FEE_UPDATED', actionType: 'system', targetId: 'settings.platform_fee', targetType: 'Settings', details: 'Platform fee changed: 18% → 20%', ip: '103.x.x.20', timestamp: '2024-05-06 16:00:44' },
  { id: 'AL011', actor: 'Admin User', actorRole: 'admin', action: 'USER_SUSPENDED', actionType: 'user', targetId: 'U011', targetType: 'Parent', details: 'Suspended parent Pooja Iyer (U011) — repeated dispute abuse.', ip: '103.x.x.10', timestamp: '2024-05-06 15:45:22' },
  { id: 'AL012', actor: 'Admin User', actorRole: 'admin', action: 'TEACHER_REJECTION', actionType: 'teacher', targetId: 'T007', targetType: 'Teacher', details: 'Rejected teacher Rohit Sharma (T007) — background verification failed.', ip: '103.x.x.10', timestamp: '2024-05-06 14:20:11' },
  { id: 'AL013', actor: 'Super Admin', actorRole: 'super_admin', action: 'ADMIN_LOGIN', actionType: 'auth', targetId: 'admin@beam.in', targetType: 'Auth', details: 'Super admin login from IP 103.x.x.20', ip: '103.x.x.20', timestamp: '2024-05-06 09:02:59' },
  { id: 'AL014', actor: 'Admin User', actorRole: 'admin', action: 'PAYOUT_RETRY', actionType: 'payment', targetId: 'PO007', targetType: 'Payout', details: 'Retried failed payout PO007 for Preethi Subramaniam (SBI ****1190)', ip: '103.x.x.10', timestamp: '2024-05-05 17:10:33' },
  { id: 'AL015', actor: 'Admin User', actorRole: 'admin', action: 'BOOKING_BULK_ASSIGN', actionType: 'booking', targetId: 'BK012,BK019', targetType: 'Booking', details: 'Bulk assigned teacher Sameer Malhotra to 2 bookings', ip: '103.x.x.10', timestamp: '2024-05-05 14:05:07' },
  { id: 'AL016', actor: 'Admin User', actorRole: 'admin', action: 'CAMPAIGN_CREATED', actionType: 'system', targetId: 'CP001', targetType: 'Campaign', details: 'Created notification campaign: Summer Kickoff 2024 (scheduled May 15)', ip: '103.x.x.10', timestamp: '2024-05-05 13:30:21' },
  { id: 'AL017', actor: 'Admin User', actorRole: 'admin', action: 'ACTIVITY_ARCHIVED', actionType: 'activity', targetId: 'ACT014', targetType: 'Activity', details: 'Archived activity: Storytelling and Drama (ID: ACT014)', ip: '103.x.x.10', timestamp: '2024-05-05 11:55:43' },
  { id: 'AL018', actor: 'Super Admin', actorRole: 'super_admin', action: 'REFUND_APPROVED', actionType: 'payment', targetId: 'PAY004', targetType: 'Payment', details: 'Approved full refund ₹400 for PAY004 (Deepa Krishnan - Chess no-show)', ip: '103.x.x.20', timestamp: '2024-05-05 10:40:08' },
  { id: 'AL019', actor: 'Admin User', actorRole: 'admin', action: 'COUPON_PAUSED', actionType: 'system', targetId: 'C007', targetType: 'Coupon', details: 'Paused coupon VIP20 (low redemption, budget review)', ip: '103.x.x.10', timestamp: '2024-05-04 16:22:55' },
  { id: 'AL020', actor: 'Admin User', actorRole: 'admin', action: 'DISPUTE_REJECTED', actionType: 'payment', targetId: 'DSP007', targetType: 'Dispute', details: 'Rejected refund request DSP007 — request outside 24h window', ip: '103.x.x.10', timestamp: '2024-05-04 15:01:17' },
  { id: 'AL021', actor: 'Super Admin', actorRole: 'super_admin', action: 'ADMIN_LOGIN', actionType: 'auth', targetId: 'admin@beam.in', targetType: 'Auth', details: 'Super admin login from IP 103.x.x.20', ip: '103.x.x.20', timestamp: '2024-05-04 09:05:44' },
  { id: 'AL022', actor: 'Admin User', actorRole: 'admin', action: 'REVIEW_REMOVED', actionType: 'user', targetId: 'RV012', targetType: 'Review', details: 'Removed review RV012 — violates community guidelines', ip: '103.x.x.10', timestamp: '2024-05-03 18:30:21' },
  { id: 'AL023', actor: 'Admin User', actorRole: 'admin', action: 'TEACHER_VERIFIED', actionType: 'teacher', targetId: 'T006', targetType: 'Teacher', details: 'Verified teacher Ananya Reddy (ID: T006)', ip: '103.x.x.10', timestamp: '2024-05-03 14:15:09' },
  { id: 'AL024', actor: 'Admin User', actorRole: 'admin', action: 'BOOKING_CANCELLED', actionType: 'booking', targetId: 'BK031', targetType: 'Booking', details: 'Admin cancelled BK031 (Meena Gupta - Yoga) — SOS incident follow-up', ip: '103.x.x.10', timestamp: '2024-05-03 11:44:57' },
  { id: 'AL025', actor: 'Super Admin', actorRole: 'super_admin', action: 'PAYOUT_BATCH_DISPATCHED', actionType: 'payment', targetId: 'PO004,PO005', targetType: 'Payout', details: 'Batch dispatched 2 payouts totalling ₹20,400 (April cycle)', ip: '103.x.x.20', timestamp: '2024-05-03 09:00:01' },
]

const ACTION_TYPE_COLORS: Record<ActionType, { bg: string; color: string }> = {
  booking:  { bg: 'var(--color-mint)', color: 'var(--color-primary)' },
  payment:  { bg: '#DCFCE7', color: '#16A34A' },
  user:     { bg: '#EDE9FE', color: '#7C3AED' },
  teacher:  { bg: '#FEF3C7', color: '#B45309' },
  activity: { bg: '#E0F2FE', color: '#0369A1' },
  system:   { bg: '#F1F5F9', color: '#64748B' },
  auth:     { bg: '#FEE2E2', color: '#DC2626' },
}

const PAGE_SIZE = 10

export default function AuditLogsPage() {
  const [search, setSearch]       = useState('')
  const [actionType, setActionType] = useState('all')
  const [dateFrom, setDateFrom]   = useState('')
  const [page, setPage]           = useState(1)

  // TODO: const { data, isLoading } = useAuditLogs({ search, actionType, dateFrom, page })

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter(l => {
      const matchSearch = !search || l.actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase())
      const matchType   = actionType === 'all' || l.actionType === actionType
      const matchDate   = !dateFrom || l.timestamp.startsWith(dateFrom)
      return matchSearch && matchType && matchDate
    })
  }, [search, actionType, dateFrom])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>Audit Logs</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-gray)', fontSize: 14 }}>
            Complete action history — <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>super_admin only</span>
          </p>
        </div>
        <div className="page-header__actions">
          {/* TODO: POST /api/admin/audit-logs/export */}
          <button className="btn btn--secondary btn--sm">Export CSV</button>
        </div>
      </div>

      {/* Summary */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Total Actions', value: MOCK_LOGS.length, delta: 'All time', up: true, Icon: Activity, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Today', value: MOCK_LOGS.filter(l => l.timestamp.startsWith('2024-05-07')).length, delta: 'Actions logged', up: true, Icon: CalendarDays, iconBg: '#DBEAFE', iconColor: '#2563EB' },
          { label: 'By Admin', value: MOCK_LOGS.filter(l => l.actorRole === 'admin').length, delta: 'Admin role', up: true, Icon: Shield, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
          { label: 'By Super Admin', value: MOCK_LOGS.filter(l => l.actorRole === 'super_admin').length, delta: 'Super admin role', up: true, Icon: ShieldCheck, iconBg: '#DCFCE7', iconColor: '#16A34A' },
        ].map(k => (
          <article key={k.label} className="card stat-card">
            <div>
              <p className="stat-card__label">{k.label}</p>
              <p className="stat-card__value">{k.value}</p>
              <p className={`stat-card__delta stat-card__delta--${k.up ? 'up' : 'down'}`}>{k.delta}</p>
            </div>
            <div className="stat-card__icon" style={{ background: k.iconBg, color: k.iconColor }}>
              <k.Icon size={24} strokeWidth={2} />
            </div>
          </article>
        ))}
      </div>

      {/* Filter + Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="filter-bar" style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <input
            className="filter-bar__search"
            placeholder="Search actor, action, or details…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={actionType} onChange={e => { setActionType(e.target.value); setPage(1) }}>
            <option value="all">All Types</option>
            <option value="booking">Booking</option>
            <option value="payment">Payment</option>
            <option value="user">User</option>
            <option value="teacher">Teacher</option>
            <option value="activity">Activity</option>
            <option value="system">System</option>
            <option value="auth">Auth</option>
          </select>
          <input type="date" className="filter-bar__select" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} title="Filter by date" />
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} entries</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Type</th>
                <th>Target</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-navy)' }}>{l.actor}</div>
                    <div style={{ fontSize: 11, color: l.actorRole === 'super_admin' ? 'var(--color-coral)' : 'var(--color-gray)', fontWeight: 600 }}>
                      {l.actorRole}
                    </div>
                  </td>
                  <td>
                    <code style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                      color: 'var(--color-navy)', background: '#F1F5F9',
                      padding: '2px 8px', borderRadius: 4, letterSpacing: '0.02em', whiteSpace: 'nowrap'
                    }}>{l.action}</code>
                  </td>
                  <td>
                    <span style={{
                      background: ACTION_TYPE_COLORS[l.actionType].bg,
                      color: ACTION_TYPE_COLORS[l.actionType].color,
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize'
                    }}>{l.actionType}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>{l.targetId}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-gray)' }}>{l.targetType}</div>
                  </td>
                  <td style={{ fontSize: 12, color: '#374151', maxWidth: 280 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.details}>
                      {l.details}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-gray)' }}>{l.ip}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="empty-state">No log entries match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ borderTop: '1px solid #F1F5F9', padding: '12px 24px' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  )
}
