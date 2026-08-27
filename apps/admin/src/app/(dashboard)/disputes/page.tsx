'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AlertOctagon, Eye, FileSearch, ShieldAlert, IndianRupee } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { DISPUTE_STATUS_BADGE } from '@/lib/status-badges'
import { adminApi } from '@/lib/api'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'

type DisputeStatus   = 'open' | 'under_review' | 'resolved' | 'rejected'
type DisputePriority = 'high' | 'medium' | 'low'
type DisputeType     = 'refund' | 'no_show' | 'quality' | 'billing'

interface Dispute {
  id: string
  parentName: string
  activity: string
  type: DisputeType
  priority: DisputePriority
  status: DisputeStatus
  amount: number
  createdAt: string
  note?: string | null
  sourceType: 'booking' | 'session_issue' | 'review' | 'payment'
  sourceId: string
  bookingId?: string | null
}

interface DisputeKpis {
  open: number
  underReview: number
  highPriority: number
  refundAtRisk: number
}

const TYPE_LABEL: Record<string, string> = {
  refund:   'Refund Request',
  no_show:  'No Show / Late',
  quality:  'Quality Issue',
  billing:  'Billing Error',
}

const PRIORITY_CLS: Record<DisputePriority, string> = {
  high:   'priority--high',
  medium: 'priority--medium',
  low:    'priority--low',
}

const PAGE_SIZE = 10

export default function DisputesPage() {
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('all')
  const [priority, setPriority] = useState('all')
  const [type, setType]         = useState('all')
  const [page, setPage]         = useState(1)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [total, setTotal]       = useState(0)
  const [kpis, setKpis]         = useState<DisputeKpis>({ open: 0, underReview: 0, highPriority: 0, refundAtRisk: 0 })
  const [loading, setLoading]   = useState(true)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.disputes.list({
      status: status !== 'all' ? status : undefined,
      type: type !== 'all' ? type : undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }).then(data => {
      setDisputes(data.items as Dispute[])
      setTotal(data.total)
      setKpis(data.kpis)
      setApiUnavailable(false)
    }).catch(() => {
      setApiUnavailable(true)
      setDisputes([])
      setTotal(0)
    }).finally(() => setLoading(false))
  }, [status, type, search, page])

  useEffect(() => { load() }, [load])

  async function runDisputeAction(key: string, action: () => Promise<void>) {
    setActionKey(key)
    try {
      await action()
      load()
    } finally {
      setActionKey(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const visibleDisputes = disputes.filter(d => priority === 'all' || d.priority === priority)
  const highPriority = disputes.filter(d => d.priority === 'high' && d.status === 'open')

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Refund requests, quality issues, and billing errors" />
      {apiUnavailable && <ApiFallbackBanner message="Live dispute data is unavailable. Review and resolution actions are disabled until the API is back." />}

      {/* High-priority alert */}
      {highPriority.length > 0 && (
        <div className="alert-strip" style={{ marginBottom: 20 }}>
          <div className="alert-strip__item alert-strip__item--amber">
            <div className="alert-strip__icon">
              <AlertOctagon size={18} strokeWidth={2} />
            </div>
            <div className="alert-strip__body">
              <p className="alert-strip__text">
                <strong>{highPriority.length} high-priority dispute{highPriority.length > 1 ? 's' : ''} require immediate attention.</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{highPriority.map(d => d.id).join(' · ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Open Disputes', value: kpis.open, delta: 'Needs resolution', up: false, Icon: Eye, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Under Review', value: kpis.underReview, delta: 'Being investigated', up: false, Icon: FileSearch, iconBg: '#FEF3C7', iconColor: '#B45309' },
          { label: 'High Priority', value: kpis.highPriority, delta: 'Immediate action', up: false, Icon: ShieldAlert, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Amount at Risk', value: `₹${kpis.refundAtRisk.toLocaleString('en-IN')}`, delta: 'Across open disputes', up: false, Icon: IndianRupee, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Filter + Table */}
      <div className="table-card">
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder="Search dispute ID or parent name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="filter-bar__select" value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="filter-bar__select" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
            <option value="all">All Types</option>
            <option value="refund">Refund</option>
            <option value="no_show">No Show</option>
            <option value="quality">Quality</option>
            <option value="billing">Billing</option>
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{visibleDisputes.length} disputes</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Dispute ID</th>
                <th>Parent</th>
                <th>Activity</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Amount</th>
                <th>Opened</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="empty-state">Loading…</td></tr>
              )}
              {!loading && visibleDisputes.map(d => (
                <tr key={d.id} style={{ background: d.priority === 'high' && d.status === 'open' ? '#FFF5F5' : undefined }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-coral)' }}>{d.id}</td>
                  <td style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)' }}>
                    {d.parentName}
                    {d.note ? <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-gray)', marginTop: 4 }}>{d.note}</div> : null}
                  </td>
                  <td style={{ fontSize: 13 }}>{d.activity || '—'}</td>
                  <td><span className="tag tag--coral" style={{ background: '#FEE2E2', color: '#991B1B' }}>{TYPE_LABEL[d.type] ?? d.type}</span></td>
                  <td><span className={PRIORITY_CLS[d.priority as DisputePriority] ?? ''}>{d.priority.charAt(0).toUpperCase() + d.priority.slice(1)}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-coral)' }}>₹{d.amount}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><span className={DISPUTE_STATUS_BADGE[d.status]?.cls ?? 'badge'}>{DISPUTE_STATUS_BADGE[d.status]?.label ?? d.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.bookingId ? <Link className="btn btn--ghost btn--sm" href={`/bookings/${d.bookingId}`}>Open Booking</Link> : <Link className="btn btn--ghost btn--sm" href="/bookings">Open Queue</Link>}
                      {d.sourceType === 'session_issue' && d.status === 'open' ? (
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={actionKey === `issue-review-${d.sourceId}`}
                          onClick={() => void runDisputeAction(`issue-review-${d.sourceId}`, async () => {
                            await adminApi.disputes.updateIssue(d.sourceId, { status: 'reviewing' })
                          })}
                        >
                          {actionKey === `issue-review-${d.sourceId}` ? 'Updating…' : 'Review'}
                        </button>
                      ) : null}
                      {d.sourceType === 'session_issue' && d.status !== 'resolved' ? (
                        <button
                          className="btn btn--sm"
                          style={{ background: '#166534', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                          disabled={actionKey === `issue-resolve-${d.sourceId}`}
                          onClick={() => void runDisputeAction(`issue-resolve-${d.sourceId}`, async () => {
                            await adminApi.disputes.updateIssue(d.sourceId, {
                              status: 'resolved',
                              resolution: d.type === 'refund' ? 'refund' : d.type === 'quality' ? 'support_only' : 'none',
                            })
                          })}
                        >
                          {actionKey === `issue-resolve-${d.sourceId}` ? 'Resolving…' : 'Resolve'}
                        </button>
                      ) : null}
                      {d.sourceType === 'payment' && d.bookingId ? (
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={actionKey === `payment-retry-${d.bookingId}`}
                          onClick={() => void runDisputeAction(`payment-retry-${d.bookingId}`, async () => {
                            await adminApi.payments.retry(d.bookingId!)
                          })}
                        >
                          {actionKey === `payment-retry-${d.bookingId}` ? 'Retrying…' : 'Retry Payment'}
                        </button>
                      ) : null}
                      {d.sourceType === 'booking' ? (
                        <span style={{ fontSize: 12, color: 'var(--color-gray)', padding: '4px 8px' }}>Refund already processed</span>
                      ) : null}
                      {d.sourceType === 'review' ? (
                        <span style={{ fontSize: 12, color: 'var(--color-gray)', padding: '4px 8px' }}>Flagged review in quality queue</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visibleDisputes.length === 0 && (
                <tr><td colSpan={9} className="empty-state">No disputes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '12px 24px' }}>
          <span style={{ fontSize: 13, color: 'var(--color-gray)', marginRight: 12 }}>{visibleDisputes.length} disputes</span>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  )
}
