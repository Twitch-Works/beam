'use client'

import { useState, useMemo } from 'react'
import { ShieldAlert, Phone, MapPin, Clock, User, CheckCircle, Eye, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { SOS_STATUS_BADGE } from '@/lib/status-badges'

// TODO: replace with useSosAlerts() hook from @beam/hooks/admin once GET /admin/sos is implemented

type SosStatus = 'active' | 'acknowledged' | 'resolved'

interface SosRecord {
  id: string
  bookingId: string
  childName: string
  childAge: number
  parentName: string
  parentPhone: string
  teacherName: string
  teacherPhone: string
  activityName: string
  address: string
  triggeredAt: string
  status: SosStatus
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
  triggeredBy: 'parent' | 'teacher' | 'system'
}

const MOCK_SOS: SosRecord[] = [
  {
    id: 'SOS-001',
    bookingId: 'BK-12589',
    childName: 'Aarav Mehta',
    childAge: 5,
    parentName: 'Nisha Mehta',
    parentPhone: '+91 98765 43210',
    teacherName: 'Priya Sharma',
    teacherPhone: '+91 99887 76655',
    activityName: 'Science Fun',
    address: 'Flat 4B, Horizon Apartments, Bandra West, Mumbai 400050',
    triggeredAt: '2024-05-13T14:32:00.000Z',
    status: 'active',
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
    triggeredBy: 'parent',
  },
  {
    id: 'SOS-002',
    bookingId: 'BK-12574',
    childName: 'Ishita Kapoor',
    childAge: 4,
    parentName: 'Rahul Kapoor',
    parentPhone: '+91 91234 56789',
    teacherName: 'Arjun Verma',
    teacherPhone: '+91 99001 12233',
    activityName: 'Storytelling Circle',
    address: '12, Greenwood Society, Koramangala, Bengaluru 560034',
    triggeredAt: '2024-05-12T10:15:00.000Z',
    status: 'acknowledged',
    acknowledgedBy: 'Ops Admin',
    acknowledgedAt: '2024-05-12T10:18:00.000Z',
    resolvedAt: null,
    resolutionNotes: null,
    triggeredBy: 'teacher',
  },
  {
    id: 'SOS-003',
    bookingId: 'BK-12551',
    childName: 'Vihaan Singh',
    childAge: 6,
    parentName: 'Deepa Singh',
    parentPhone: '+91 87654 32109',
    teacherName: 'Neha Iyer',
    teacherPhone: '+91 98112 34567',
    activityName: 'Art & Craft',
    address: 'Plot 7, Suncity Enclave, Punjabi Bagh, Delhi 110035',
    triggeredAt: '2024-05-10T16:45:00.000Z',
    status: 'resolved',
    acknowledgedBy: 'Super Admin',
    acknowledgedAt: '2024-05-10T16:47:00.000Z',
    resolvedAt: '2024-05-10T17:30:00.000Z',
    resolutionNotes: 'Teacher had a minor accident. Ambulance called. Parent was present. Session cancelled and full refund issued.',
    triggeredBy: 'parent',
  },
  {
    id: 'SOS-004',
    bookingId: 'BK-12537',
    childName: 'Ananya Rao',
    childAge: 3,
    parentName: 'Suresh Rao',
    parentPhone: '+91 90000 11223',
    teacherName: 'Karan Mehta',
    teacherPhone: '+91 97890 12345',
    activityName: 'Messy Play Session',
    address: '302, Palm Grove, Andheri East, Mumbai 400069',
    triggeredAt: '2024-05-08T11:20:00.000Z',
    status: 'resolved',
    acknowledgedBy: 'Ops Admin',
    acknowledgedAt: '2024-05-08T11:22:00.000Z',
    resolvedAt: '2024-05-08T12:00:00.000Z',
    resolutionNotes: 'Child had an allergic reaction to art material. Parents took child to clinic. Situation resolved. Activity flagged for materials review.',
    triggeredBy: 'teacher',
  },
  {
    id: 'SOS-005',
    bookingId: 'BK-12521',
    childName: 'Reyansh Gupta',
    childAge: 5,
    parentName: 'Priya Gupta',
    parentPhone: '+91 88776 65544',
    teacherName: 'Ananya Das',
    teacherPhone: '+91 99988 77766',
    activityName: 'Yoga for Kids',
    address: 'Villa 15, Serene Heights, Whitefield, Bengaluru 560066',
    triggeredAt: '2024-05-06T09:05:00.000Z',
    status: 'resolved',
    acknowledgedBy: 'Ops Admin',
    acknowledgedAt: '2024-05-06T09:07:00.000Z',
    resolvedAt: '2024-05-06T09:45:00.000Z',
    resolutionNotes: 'False alarm — parent accidentally triggered SOS button on app. Session continued normally. Parent informed about the button placement.',
    triggeredBy: 'parent',
  },
  {
    id: 'SOS-006',
    bookingId: 'BK-12498',
    childName: 'Kavya Reddy',
    childAge: 4,
    parentName: 'Vikram Reddy',
    parentPhone: '+91 91111 22334',
    teacherName: 'Meera Joshi',
    teacherPhone: '+91 98765 11223',
    activityName: 'Puppet Show',
    address: 'Flat 8A, Emerald Heights, Hitech City, Hyderabad 500081',
    triggeredAt: '2024-05-04T15:50:00.000Z',
    status: 'resolved',
    acknowledgedBy: 'Super Admin',
    acknowledgedAt: '2024-05-04T15:52:00.000Z',
    resolvedAt: '2024-05-04T16:30:00.000Z',
    resolutionNotes: 'Teacher reported feeling unwell mid-session. Parent was present. Session ended early. Partial refund issued for 30 min unused.',
    triggeredBy: 'system',
  },
]


const TRIGGERED_BY_LABEL: Record<SosRecord['triggeredBy'], string> = {
  parent:  'Parent',
  teacher: 'Teacher',
  system:  'System',
}

const PAGE_SIZE = 10

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function DetailDrawer({ record, onClose }: { record: SosRecord; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)' }} />

      <aside
        style={{
          position: 'relative', zIndex: 1,
          width: 460, height: '100vh', background: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
          overflowY: 'auto', padding: '28px 28px 40px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldAlert size={16} color="#DC2626" />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: '#DC2626' }}>{record.id}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-navy)' }}>SOS Incident Detail</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-gray)' }}>Booking: {record.bookingId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)', padding: 4 }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={SOS_STATUS_BADGE[record.status].cls}>{SOS_STATUS_BADGE[record.status].label}</span>
          <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Triggered by {TRIGGERED_BY_LABEL[record.triggeredBy]}</span>
        </div>

        {/* Child + Location */}
        <section style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray)' }}>Session Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <User size={14} color="var(--color-gray)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-navy)' }}>{record.childName}, {record.childAge}y</div>
                <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{record.activityName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MapPin size={14} color="var(--color-gray)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--color-navy)', lineHeight: 1.4 }}>{record.address}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Clock size={14} color="var(--color-gray)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--color-navy)' }}>{formatDateTime(record.triggeredAt)}</div>
            </div>
          </div>
        </section>

        {/* Contacts */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Parent', name: record.parentName, phone: record.parentPhone },
            { label: 'Teacher', name: record.teacherName, phone: record.teacherPhone },
          ].map(c => (
            <div key={c.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray)' }}>{c.label}</p>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: 'var(--color-navy)' }}>{c.name}</p>
              <a
                href={`tel:${c.phone.replace(/\s/g, '')}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, color: 'var(--color-primary)', fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Phone size={13} />
                {c.phone}
              </a>
            </div>
          ))}
        </section>

        {/* Acknowledgement */}
        {record.acknowledgedBy && (
          <section style={{ borderLeft: '3px solid #FCB857', paddingLeft: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B45309' }}>Acknowledged</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-navy)' }}>
              By <strong>{record.acknowledgedBy}</strong> · {formatDateTime(record.acknowledgedAt!)}
            </p>
          </section>
        )}

        {/* Resolution */}
        {record.resolvedAt && (
          <section style={{ borderLeft: '3px solid #22C55E', paddingLeft: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#166534' }}>Resolution</p>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-gray)' }}>Resolved at {formatDateTime(record.resolvedAt)}</p>
            {record.resolutionNotes && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-navy)', lineHeight: 1.5 }}>{record.resolutionNotes}</p>
            )}
          </section>
        )}

        {/* Actions */}
        {record.status !== 'resolved' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
            <a
              href={`tel:${record.parentPhone.replace(/\s/g, '')}`}
              className="btn btn--danger"
              style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
            >
              <Phone size={14} />
              Call Parent
            </a>
            <a
              href={`tel:${record.teacherPhone.replace(/\s/g, '')}`}
              className="btn"
              style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, background: '#1787A6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >
              <Phone size={14} />
              Call Teacher
            </a>
          </div>
        )}
      </aside>
    </div>
  )
}

export default function SosPage() {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState<SosRecord | null>(null)

  const filtered = useMemo(() => {
    return MOCK_SOS.filter(s => {
      const matchSearch = !search ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.childName.toLowerCase().includes(search.toLowerCase()) ||
        s.parentName.toLowerCase().includes(search.toLowerCase()) ||
        s.bookingId.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || s.status === status
      return matchSearch && matchStatus
    })
  }, [search, status])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = {
    active:       MOCK_SOS.filter(s => s.status === 'active').length,
    acknowledged: MOCK_SOS.filter(s => s.status === 'acknowledged').length,
    resolved:     MOCK_SOS.filter(s => s.status === 'resolved').length,
    total:        MOCK_SOS.length,
  }

  const activeAlerts = MOCK_SOS.filter(s => s.status === 'active')

  return (
    <div>
      <PageHeader title="SOS Alerts" subtitle="Complete record of all safety incidents across active sessions" />

      {/* Active alert banner */}
      {activeAlerts.length > 0 && (
        <div className="alert-strip" style={{ marginBottom: 20 }}>
          <div className="alert-strip__item alert-strip__item--amber">
            <div className="alert-strip__icon">
              <ShieldAlert size={18} strokeWidth={2} />
            </div>
            <div className="alert-strip__body">
              <p className="alert-strip__text">
                <strong>{activeAlerts.length} active SOS alert{activeAlerts.length > 1 ? 's' : ''} — immediate action required.</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{activeAlerts.map(s => s.id).join(' · ')}</span>
              </p>
            </div>
            <button type="button" className="alert-strip__btn" onClick={() => setStatus('active')}>View Active</button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Active',       value: kpis.active,       Icon: AlertTriangle, iconBg: '#FEE2E2', iconColor: '#DC2626', delta: 'Needs immediate action' },
          { label: 'Acknowledged', value: kpis.acknowledged, Icon: Eye,           iconBg: '#FEF3C7', iconColor: '#B45309', delta: 'Being monitored' },
          { label: 'Resolved',     value: kpis.resolved,     Icon: CheckCircle,   iconBg: '#DCFCE7', iconColor: '#166534', delta: 'Closed incidents' },
          { label: 'Total',        value: kpis.total,        Icon: ShieldAlert,   iconBg: '#E5F7F4', iconColor: '#0F4C5C', delta: 'All time' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Note about realtime */}
      <div style={{
        background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10,
        padding: '10px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ margin: 0, fontSize: 13, color: '#1D4ED8' }}>
          Showing stored SOS records. Live alerts via WebSocket are not yet connected — new incidents will appear here after page refresh.
        </p>
      </div>

      {/* Filter + Table */}
      <div className="table-card">
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder="Search by SOS ID, booking ID, child or parent name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select
            className="filter-bar__select"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} incidents</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SOS ID</th>
                <th>Child · Activity</th>
                <th>Parent</th>
                <th>Teacher</th>
                <th>Address</th>
                <th>Triggered By</th>
                <th>Triggered At</th>
                <th>Status</th>
                <th>Acknowledged By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr
                  key={s.id}
                  style={{ background: s.status === 'active' ? '#FFF5F5' : undefined }}
                >
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                      color: s.status === 'active' ? '#DC2626' : 'var(--color-coral)',
                    }}>
                      {s.id}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{s.bookingId}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)' }}>{s.childName}, {s.childAge}y</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{s.activityName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-navy)' }}>{s.parentName}</div>
                    <a href={`tel:${s.parentPhone.replace(/\s/g, '')}`} style={{ fontSize: 12, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 2 }}>
                      <Phone size={11} />
                      {s.parentPhone}
                    </a>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-navy)' }}>{s.teacherName}</div>
                    <a href={`tel:${s.teacherPhone.replace(/\s/g, '')}`} style={{ fontSize: 12, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 2 }}>
                      <Phone size={11} />
                      {s.teacherPhone}
                    </a>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-gray)', maxWidth: 180 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}
                      title={s.address}
                    >
                      <MapPin size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: s.triggeredBy === 'parent' ? '#0F4C5C' : s.triggeredBy === 'teacher' ? '#5B21B6' : '#92400E',
                      background: s.triggeredBy === 'parent' ? '#E5F7F4' : s.triggeredBy === 'teacher' ? '#EDE9FE' : '#FEF3C7',
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {TRIGGERED_BY_LABEL[s.triggeredBy]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-gray)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(s.triggeredAt)}
                  </td>
                  <td>
                    <span className={SOS_STATUS_BADGE[s.status].cls}>
                      {SOS_STATUS_BADGE[s.status].label}
                    </span>
                  </td>
                  <td>
                    {s.acknowledgedBy ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-navy)' }}>{s.acknowledgedBy}</div>
                        {s.acknowledgedAt && (
                          <div style={{ fontSize: 11, color: 'var(--color-gray)' }}>{formatDateTime(s.acknowledgedAt)}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Unacknowledged</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setSelected(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-state">No SOS incidents match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '12px 24px' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} type="button">← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)} type="button">{p}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} type="button">Next →</button>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
