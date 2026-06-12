'use client'

import { useState, useMemo } from 'react'
import { Tag, Ticket, IndianRupee, Clock } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'

// TODO: replace with useDiscounts() hook from @beam/hooks/admin
// import { useDiscounts } from '@beam/hooks/admin'

type CouponType   = 'percent' | 'flat'
type CouponStatus = 'active' | 'expired' | 'paused'

interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrderAmount: number
  maxDiscount?: number
  usedCount: number
  usageLimit: number
  validFrom: string
  validUntil: string
  status: CouponStatus
  description: string
}

const MOCK_COUPONS: Coupon[] = [
  { id: 'C001', code: 'FIRST50', type: 'percent', value: 50, minOrderAmount: 300, maxDiscount: 250, usedCount: 142, usageLimit: 500, validFrom: '2024-04-01', validUntil: '2024-06-30', status: 'active', description: 'New user first booking 50% off' },
  { id: 'C002', code: 'BEAM100', type: 'flat', value: 100, minOrderAmount: 400, usedCount: 89, usageLimit: 200, validFrom: '2024-03-01', validUntil: '2024-05-31', status: 'active', description: 'Flat ₹100 off — platform promotion' },
  { id: 'C003', code: 'SUMMER25', type: 'percent', value: 25, minOrderAmount: 500, maxDiscount: 150, usedCount: 200, usageLimit: 200, validFrom: '2024-04-15', validUntil: '2024-05-15', status: 'expired', description: 'Summer campaign 25% off' },
  { id: 'C004', code: 'YOGA150', type: 'flat', value: 150, minOrderAmount: 350, usedCount: 34, usageLimit: 100, validFrom: '2024-05-01', validUntil: '2024-05-31', status: 'active', description: 'Yoga activity special' },
  { id: 'C005', code: 'REFER200', type: 'flat', value: 200, minOrderAmount: 500, usedCount: 67, usageLimit: 300, validFrom: '2024-01-01', validUntil: '2024-12-31', status: 'active', description: 'Referral reward coupon' },
  { id: 'C006', code: 'DIWALI30', type: 'percent', value: 30, minOrderAmount: 400, maxDiscount: 300, usedCount: 456, usageLimit: 500, validFrom: '2023-10-20', validUntil: '2023-11-10', status: 'expired', description: 'Diwali festive offer' },
  { id: 'C007', code: 'VIP20', type: 'percent', value: 20, minOrderAmount: 600, maxDiscount: 200, usedCount: 12, usageLimit: 50, validFrom: '2024-05-01', validUntil: '2024-05-31', status: 'paused', description: 'VIP parent loyalty discount' },
  { id: 'C008', code: 'ARTS75', type: 'flat', value: 75, minOrderAmount: 300, usedCount: 28, usageLimit: 150, validFrom: '2024-04-01', validUntil: '2024-06-30', status: 'active', description: 'Arts category special offer' },
]

const STATUS_BADGE: Record<CouponStatus, { label: string; cls: string }> = {
  active:  { label: 'Active',   cls: 'badge badge--confirmed' },
  expired: { label: 'Expired',  cls: 'badge badge--cancelled' },
  paused:  { label: 'Paused',   cls: 'badge badge--pending' },
}

const PAGE_SIZE = 10

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isNearLimit = pct >= 80
  return (
    <div>
      <div style={{ background: '#F1F5F9', borderRadius: 99, height: 6, width: 80, overflow: 'hidden' }}>
        <div style={{ background: isNearLimit ? 'var(--color-coral)' : 'var(--color-primary)', borderRadius: 99, height: '100%', width: `${pct}%` }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
        {used}/{limit}
      </div>
    </div>
  )
}

export default function CouponsPage() {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [type, setType]       = useState('all')
  const [page, setPage]       = useState(1)
  const [showForm, setShowForm] = useState(false)

  // New coupon form state
  const [newCode, setNewCode]   = useState('')
  const [newType, setNewType]   = useState<CouponType>('percent')
  const [newValue, setNewValue] = useState('')
  const [newMin, setNewMin]     = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [newUntil, setNewUntil] = useState('')
  const [newDesc, setNewDesc]   = useState('')

  // TODO: replace mock with -> const { data, isLoading } = useDiscounts({ search, status, type, page })

  const filtered = useMemo(() => {
    return MOCK_COUPONS.filter(c => {
      const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || c.status === status
      const matchType   = type === 'all' || c.type === type
      return matchSearch && matchStatus && matchType
    })
  }, [search, status, type])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = {
    activeCodes: MOCK_COUPONS.filter(c => c.status === 'active').length,
    totalUsed:   MOCK_COUPONS.reduce((s, c) => s + c.usedCount, 0),
    discountGiven: 38400,
    nearExpiry: MOCK_COUPONS.filter(c => c.status === 'active' && new Date(c.validUntil) <= new Date('2024-05-31')).length,
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    // TODO: POST /api/admin/discounts
    alert(`Creating coupon: ${newCode} — implement with useDiscounts mutation`)
    setShowForm(false)
  }

  return (
    <div>
      <PageHeader title="Coupons & Offers" subtitle="Discount codes, promotions, and offer management">
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          {showForm ? '✕ Cancel' : '+ New Coupon'}
        </button>
      </PageHeader>

      {/* KPI Strip */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Active Codes', value: kpis.activeCodes, delta: 'Currently live', up: true, Icon: Tag, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Total Redemptions', value: kpis.totalUsed, delta: '+34 this week', up: true, Icon: Ticket, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Discount Issued', value: `₹${kpis.discountGiven.toLocaleString('en-IN')}`, delta: 'This month', up: false, Icon: IndianRupee, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Expiring This Month', value: kpis.nearExpiry, delta: 'Need review', up: false, Icon: Clock, iconBg: '#FEF3C7', iconColor: '#B45309' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24,
          border: '1px solid var(--color-mint)'
        }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--color-navy)', fontSize: 16, fontWeight: 700 }}>Create New Coupon</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Coupon Code *</label>
                <input required value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER50"
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14, fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Type *</label>
                <select value={newType} onChange={e => setNewType(e.target.value as CouponType)}
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }}>
                  <option value="percent">Percentage Off</option>
                  <option value="flat">Flat Discount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Discount Value *</label>
                <input required type="number" value={newValue} onChange={e => setNewValue(e.target.value)}
                  placeholder={newType === 'percent' ? '% e.g. 25' : '₹ e.g. 100'}
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Min Order (₹) *</label>
                <input required type="number" value={newMin} onChange={e => setNewMin(e.target.value)}
                  placeholder="e.g. 400"
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Usage Limit *</label>
                <input required type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
                  placeholder="e.g. 200"
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Valid Until *</label>
                <input required type="date" value={newUntil} onChange={e => setNewUntil(e.target.value)}
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: 6 }}>Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Internal description of this offer"
                style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Create Coupon
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn--secondary btn--sm" style={{ padding: '10px 20px' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="filter-bar" style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <input
            className="filter-bar__search"
            placeholder="Search coupon code or description…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </select>
          <select className="filter-bar__select" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
            <option value="all">All Types</option>
            <option value="percent">Percentage</option>
            <option value="flat">Flat</option>
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} coupons</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Valid Until</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                      color: 'var(--color-primary)', background: 'var(--color-mint)',
                      padding: '3px 10px', borderRadius: 6, letterSpacing: '0.05em'
                    }}>{c.code}</span>
                  </td>
                  <td>
                    <span className={`tag ${c.type === 'percent' ? '' : 'tag--lavender'}`}>
                      {c.type === 'percent' ? '% Percent' : '₹ Flat'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-coral)' }}>
                    {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                    {c.maxDiscount && <div style={{ fontSize: 11, color: 'var(--color-gray)', fontWeight: 400 }}>Max ₹{c.maxDiscount}</div>}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{c.minOrderAmount}</td>
                  <td><UsageBar used={c.usedCount} limit={c.usageLimit} /></td>
                  <td style={{ fontSize: 13 }}>{c.validUntil}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)', maxWidth: 180 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }} title={c.description}>
                      {c.description}
                    </span>
                  </td>
                  <td><span className={STATUS_BADGE[c.status].cls}>{STATUS_BADGE[c.status].label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* TODO: PATCH /api/admin/discounts/:id */}
                      <button className="btn btn--ghost btn--sm">Edit</button>
                      {c.status === 'active'
                        ? /* TODO: POST /api/admin/discounts/:id/pause */
                          <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }}>Pause</button>
                        : c.status === 'paused'
                        ? /* TODO: POST /api/admin/discounts/:id/activate */
                          <button className="btn btn--ghost btn--sm" style={{ color: '#16A34A' }}>Activate</button>
                        : null
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="empty-state">No coupons match your filters.</td></tr>
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
