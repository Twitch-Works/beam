'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertOctagon, Eye, FileSearch, ShieldAlert, IndianRupee } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { DISPUTE_STATUS_BADGE } from '@/lib/status-badges'
import { adminApi } from '@/lib/api'

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

  function markDisputeStatus(id: string, newStatus: DisputeStatus) {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
  }

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
    }).catch(() => {
      // API unavailable — show empty state
      setDisputes([])
      setTotal(0)
    }).finally(() => setLoading(false))
  }, [status, type, search, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const highPriority = disputes.filter(d => d.priority === 'high' && d.status === 'open')

  return (
    <div>
      <PageHeader title="Disputes" subtitle="Refund requests, quality issues, and billing errors" />

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
          <span className="filter-bar__count">{total} disputes</span>
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
              {!loading && disputes.map(d => (
                <tr key={d.id} style={{ background: d.priority === 'high' && d.status === 'open' ? '#FFF5F5' : undefined }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-coral)' }}>{d.id}</td>
                  <td style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)' }}>{d.parentName}</td>
                  <td style={{ fontSize: 13 }}>{d.activity || '—'}</td>
                  <td><span className="tag tag--coral" style={{ background: '#FEE2E2', color: '#991B1B' }}>{TYPE_LABEL[d.type] ?? d.type}</span></td>
                  <td><span className={PRIORITY_CLS[d.priority as DisputePriority] ?? ''}>{d.priority.charAt(0).toUpperCase() + d.priority.slice(1)}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-coral)' }}>₹{d.amount}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><span className={DISPUTE_STATUS_BADGE[d.status]?.cls ?? 'badge'}>{DISPUTE_STATUS_BADGE[d.status]?.label ?? d.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.status === 'open' && (
                        <button className="btn btn--ghost btn--sm" onClick={() => markDisputeStatus(d.id, 'under_review')}>Review</button>
                      )}
                      {d.status === 'under_review' && (
                        <span style={{ fontSize: 12, color: 'var(--color-gray)', padding: '4px 8px' }}>Under Review</span>
                      )}
                      {(d.status === 'open' || d.status === 'under_review') && (
                        <button className="btn btn--sm" style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }} onClick={() => markDisputeStatus(d.id, 'resolved')}>Resolve</button>
                      )}
                      {(d.status === 'resolved' || d.status === 'rejected') && (
                        <span style={{ fontSize: 12, color: 'var(--color-gray)', padding: '4px 8px', fontStyle: 'italic' }}>{d.status === 'resolved' ? 'Resolved' : 'Rejected'}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && disputes.length === 0 && (
                <tr><td colSpan={9} className="empty-state">No disputes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '12px 24px' }}>
          <span style={{ fontSize: 13, color: 'var(--color-gray)', marginRight: 12 }}>{total} disputes</span>
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
