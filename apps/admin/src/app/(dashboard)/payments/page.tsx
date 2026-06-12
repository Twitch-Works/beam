'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'
import { IndianRupee, Banknote, RotateCcw, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { PAYMENT_STATUS_BADGE, PAYOUT_STATUS_BADGE } from '@/lib/status-badges'

// TODO: replace with usePayments() and usePayouts() from @beam/hooks/admin
// import { usePayments, usePayouts } from '@beam/hooks/admin'

type PaymentStatus = 'success' | 'failed' | 'refunded' | 'pending'
type PayoutStatus  = 'queued' | 'dispatched' | 'settled' | 'failed'

interface Payment {
  id: string
  bookingId: string
  parentName: string
  activity: string
  amount: number
  gateway: string
  status: PaymentStatus
  date: string
  refundAmount?: number
}

interface Payout {
  id: string
  teacherName: string
  bankAccount: string
  amount: number
  sessionsCount: number
  status: PayoutStatus
  scheduledDate: string
  settledDate?: string
}

const MOCK_PAYMENTS: Payment[] = [
  { id: 'PAY001', bookingId: 'BK001', parentName: 'Priya Sharma', activity: 'Yoga for Kids', amount: 350, gateway: 'Razorpay', status: 'success', date: '2024-05-06' },
  { id: 'PAY002', bookingId: 'BK002', parentName: 'Rahul Mehta', activity: 'Beginner Guitar', amount: 500, gateway: 'Razorpay', status: 'success', date: '2024-05-07' },
  { id: 'PAY003', bookingId: 'BK003', parentName: 'Anita Patel', activity: 'Bharatanatyam', amount: 600, gateway: 'UPI', status: 'success', date: '2024-05-01' },
  { id: 'PAY004', bookingId: 'BK007', parentName: 'Deepa Krishnan', activity: 'Chess Basics', amount: 400, gateway: 'Razorpay', status: 'refunded', refundAmount: 400, date: '2024-04-28' },
  { id: 'PAY005', bookingId: 'BK004', parentName: 'Meena Gupta', activity: 'Watercolor Painting', amount: 400, gateway: 'UPI', status: 'pending', date: '2024-05-07' },
  { id: 'PAY006', bookingId: 'BK005', parentName: 'Vikram Singh', activity: 'Scratch Coding', amount: 700, gateway: 'Razorpay', status: 'success', date: '2024-05-07' },
  { id: 'PAY007', bookingId: 'BK006', parentName: 'Nisha Agarwal', activity: 'Carnatic Vocal', amount: 550, gateway: 'UPI', status: 'success', date: '2024-04-30' },
  { id: 'PAY008', bookingId: 'BK009', parentName: 'Lakshmi Rao', activity: 'Watercolor Painting', amount: 400, gateway: 'Razorpay', status: 'failed', date: '2024-05-02' },
  { id: 'PAY009', bookingId: 'BK010', parentName: 'Sanjay Joshi', activity: 'Cooking Adventures', amount: 650, gateway: 'UPI', status: 'success', date: '2024-05-06' },
  { id: 'PAY010', bookingId: 'BK011', parentName: 'Pooja Iyer', activity: 'Bharatanatyam', amount: 600, gateway: 'Razorpay', status: 'success', date: '2024-04-28' },
  { id: 'PAY011', bookingId: 'BK013', parentName: 'Priya Sharma', activity: 'Science Experiments', amount: 500, gateway: 'UPI', status: 'success', date: '2024-05-06' },
  { id: 'PAY012', bookingId: 'BK015', parentName: 'Kavya Nair', activity: 'Kathakali Dance', amount: 600, gateway: 'Razorpay', status: 'success', date: '2024-05-06' },
]

const MOCK_PAYOUTS: Payout[] = [
  { id: 'PO001', teacherName: 'Arjun Kapoor', bankAccount: 'HDFC ****4521', amount: 8400, sessionsCount: 28, status: 'queued', scheduledDate: '2024-05-10' },
  { id: 'PO002', teacherName: 'Ravi Shankar', bankAccount: 'SBI ****7832', amount: 10500, sessionsCount: 21, status: 'queued', scheduledDate: '2024-05-10' },
  { id: 'PO003', teacherName: 'Ananya Reddy', bankAccount: 'ICICI ****2910', amount: 7200, sessionsCount: 12, status: 'dispatched', scheduledDate: '2024-05-08', settledDate: undefined },
  { id: 'PO004', teacherName: 'Sneha Patel', bankAccount: 'Axis ****6601', amount: 4800, sessionsCount: 12, status: 'settled', scheduledDate: '2024-05-03', settledDate: '2024-05-05' },
  { id: 'PO005', teacherName: 'Divya Menon', bankAccount: 'Kotak ****3344', amount: 15600, sessionsCount: 26, status: 'settled', scheduledDate: '2024-05-03', settledDate: '2024-05-05' },
  { id: 'PO006', teacherName: 'Gaurav Tiwari', bankAccount: 'HDFC ****8822', amount: 6000, sessionsCount: 15, status: 'queued', scheduledDate: '2024-05-10' },
  { id: 'PO007', teacherName: 'Preethi Subramaniam', bankAccount: 'SBI ****1190', amount: 4400, sessionsCount: 8, status: 'failed', scheduledDate: '2024-05-03' },
]

const PAGE_SIZE = 10

export default function PaymentsPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const [tab, setTab]             = useState<'ledger' | 'payouts'>('ledger')
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('all')
  const [page, setPage]           = useState(1)
  const [livePayments, setLivePayments]   = useState<Payment[] | null>(null)
  const [livePayouts, setLivePayouts]     = useState<Payout[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    void (async () => {
      try {
        const res = await adminApi.payments.list({ status: status === 'all' ? undefined : status, page })
        setLivePayments(res.payments.map((p: any) => ({
          id: p.id,
          bookingId: p.bookingId ?? p.booking_id ?? '',
          parentName: p.parentName ?? p.parent_name ?? '',
          activity: p.activityTitle ?? p.activity_title ?? '',
          amount: Number(p.amount ?? 0),
          gateway: p.gateway ?? '',
          status: p.status as PaymentStatus,
          date: (p.createdAt ?? p.created_at ?? '').split('T')[0],
          refundAmount: p.refundAmount ? Number(p.refundAmount) : undefined,
        })))
        setLivePayouts(res.payouts.map((p: any) => ({
          id: p.id,
          teacherName: p.teacherName ?? p.teacher_name ?? '',
          bankAccount: p.bankAccount ?? p.bank_account ?? '',
          amount: Number(p.amount ?? 0),
          sessionsCount: Number(p.sessionCount ?? p.session_count ?? 0),
          status: p.status as PayoutStatus,
          scheduledDate: (p.scheduledAt ?? p.scheduled_at ?? '').split('T')[0],
          settledDate: p.settledAt ? (p.settledAt).split('T')[0] : undefined,
        })))
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, status, page])

  const activePayments = USE_MOCK_DATA ? MOCK_PAYMENTS : (livePayments ?? MOCK_PAYMENTS)
  const activePayouts  = USE_MOCK_DATA ? MOCK_PAYOUTS  : (livePayouts  ?? MOCK_PAYOUTS)

  const filteredPayments = useMemo(() => {
    return activePayments.filter(p => {
      const matchSearch = !search || p.parentName.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || p.status === status
      return matchSearch && matchStatus
    })
  }, [activePayments, search, status])

  const filteredPayouts = useMemo(() => {
    return activePayouts.filter(p => {
      const matchSearch = !search || p.teacherName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || p.status === status
      return matchSearch && matchStatus
    })
  }, [activePayouts, search, status])

  const activeList = tab === 'ledger' ? filteredPayments : filteredPayouts
  const totalPages = Math.ceil(activeList.length / PAGE_SIZE)

  const kpis = {
    totalRevenue:   activePayments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0),
    pendingPayouts: activePayouts.filter(p => p.status === 'queued').reduce((s, p) => s + p.amount, 0),
    refunds:        activePayments.filter(p => p.status === 'refunded').reduce((s, p) => s + (p.refundAmount || 0), 0),
    failed:         activePayments.filter(p => p.status === 'failed').length,
  }

  return (
    <div>
      <PageHeader title="Payments" subtitle="Payment ledger, payout queue, and reconciliation">
        <button className="btn btn--secondary btn--sm" onClick={() => alert('Export report coming soon.')}>Export Report</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live payment data is unavailable. Showing demo ledger data; refund, retry, and payout actions are unavailable." />}

      {/* KPI Cards */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Revenue Collected', value: `₹${kpis.totalRevenue.toLocaleString('en-IN')}`, delta: '+18% vs last month', up: true, Icon: IndianRupee, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Pending Payouts', value: `₹${kpis.pendingPayouts.toLocaleString('en-IN')}`, delta: 'Scheduled 10 May', up: false, Icon: Banknote, iconBg: '#FEF3C7', iconColor: '#B45309' },
            { label: 'Refunds Issued', value: `₹${kpis.refunds.toLocaleString('en-IN')}`, delta: '1 this month', up: false, Icon: RotateCcw, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
            { label: 'Failed Payments', value: kpis.failed, delta: 'Need attention', up: false, Icon: AlertCircle, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          ].map(k => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Tabs + Table */}
      <div className="table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 24px' }}>
          {(['ledger', 'payouts'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); setStatus('all') }}
              style={{
                background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                color: tab === t ? 'var(--color-primary)' : 'var(--color-gray)',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1
              }}>
              {t === 'ledger' ? 'Payment Ledger' : 'Payout Queue'}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder={tab === 'ledger' ? 'Search by payment ID or parent…' : 'Search teacher name…'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            {tab === 'ledger' ? (
              <>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </>
            ) : (
              <>
                <option value="queued">Queued</option>
                <option value="dispatched">Dispatched</option>
                <option value="settled">Settled</option>
                <option value="failed">Failed</option>
              </>
            )}
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{activeList.length} records</span>
        </div>

        {tab === 'ledger' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking</th>
                  <th>Parent</th>
                  <th>Activity</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonTableRows count={8} cols={9} />}
                {!loading && filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{p.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)' }}>{p.bookingId}</td>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{p.parentName}</td>
                    <td style={{ fontSize: 13 }}>{p.activity}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>₹{p.amount}</span>
                      {p.refundAmount && <div style={{ fontSize: 11, color: 'var(--color-coral)' }}>Refund: ₹{p.refundAmount}</div>}
                    </td>
                    <td><span className="tag tag--gray">{p.gateway}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{p.date}</td>
                    <td><span className={PAYMENT_STATUS_BADGE[p.status].cls}>{PAYMENT_STATUS_BADGE[p.status].label}</span></td>
                    <td>
                      {p.status === 'success' && (
                        <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }} onClick={() => alert('Refund coming soon.')}>Refund</button>
                      )}
                      {p.status === 'failed' && (
                        <button className="btn btn--ghost btn--sm" onClick={() => alert('Retry coming soon.')}>Retry</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && filteredPayments.length === 0 && (
                  <tr><td colSpan={9} className="empty-state">No payments match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payouts' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Teacher</th>
                  <th>Bank Account</th>
                  <th>Amount</th>
                  <th>Sessions</th>
                  <th>Scheduled</th>
                  <th>Settled</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonTableRows count={8} cols={9} />}
                {!loading && filteredPayouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{p.id}</td>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{p.teacherName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-gray)' }}>{p.bankAccount}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.sessionsCount}</td>
                    <td style={{ fontSize: 13 }}>{p.scheduledDate}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{p.settledDate || '—'}</td>
                    <td><span className={PAYOUT_STATUS_BADGE[p.status].cls}>{PAYOUT_STATUS_BADGE[p.status].label}</span></td>
                    <td>
                      {p.status === 'queued' && (
                        <button className="btn btn--sm" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }} onClick={() => alert('Payout dispatch coming soon.')}>Dispatch</button>
                      )}
                      {p.status === 'failed' && (
                        <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }} onClick={() => alert('Retry coming soon.')}>Retry</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && filteredPayouts.length === 0 && (
                  <tr><td colSpan={9} className="empty-state">No payouts match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
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
