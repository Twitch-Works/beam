'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { useRouter } from 'next/navigation'
import { CalendarDays, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { BOOKING_STATUS_BADGE } from '@/lib/status-badges'

// TODO: replace with useAllBookings() hook from @beam/hooks/admin when @beam/hooks/admin is wired

type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'rescheduled'

interface Booking {
  id: string
  rawId: string
  parentName: string
  childName: string
  activity: string
  teacher: string | null
  city: string
  date: string
  time: string
  status: BookingStatus
  amount: number
  createdAt: string
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'BK001', rawId: '', parentName: 'Priya Sharma', childName: 'Aarav Sharma', activity: 'Yoga for Kids', teacher: 'Arjun Kapoor', city: 'Mumbai', date: '2024-05-08', time: '10:00 AM', status: 'confirmed', amount: 350, createdAt: '2024-05-06' },
  { id: 'BK002', rawId: '', parentName: 'Rahul Mehta', childName: 'Riya Mehta', activity: 'Beginner Guitar', teacher: 'Ravi Shankar', city: 'Delhi', date: '2024-05-08', time: '11:30 AM', status: 'confirmed', amount: 500, createdAt: '2024-05-07' },
  { id: 'BK003', rawId: '', parentName: 'Anita Patel', childName: 'Karan Patel', activity: 'Bharatanatyam', teacher: 'Ananya Reddy', city: 'Bangalore', date: '2024-05-07', time: '4:00 PM', status: 'completed', amount: 600, createdAt: '2024-05-01' },
  { id: 'BK004', rawId: '', parentName: 'Meena Gupta', childName: 'Sia Gupta', activity: 'Watercolor Painting', teacher: 'Sneha Patel', city: 'Mumbai', date: '2024-05-09', time: '3:00 PM', status: 'pending', amount: 400, createdAt: '2024-05-07' },
  { id: 'BK005', rawId: '', parentName: 'Vikram Singh', childName: 'Aryan Singh', activity: 'Scratch Coding', teacher: null, city: 'Pune', date: '2024-05-10', time: '10:00 AM', status: 'pending', amount: 700, createdAt: '2024-05-07' },
  { id: 'BK006', rawId: '', parentName: 'Nisha Agarwal', childName: 'Zara Agarwal', activity: 'Carnatic Vocal', teacher: 'Preethi Subramaniam', city: 'Bangalore', date: '2024-05-06', time: '5:30 PM', status: 'completed', amount: 550, createdAt: '2024-04-30' },
  { id: 'BK007', rawId: '', parentName: 'Deepa Krishnan', childName: 'Dev Krishnan', activity: 'Chess Basics', teacher: 'Gaurav Tiwari', city: 'Chennai', date: '2024-05-05', time: '6:00 PM', status: 'cancelled', amount: 400, createdAt: '2024-04-28' },
  { id: 'BK008', rawId: '', parentName: 'Suresh Reddy', childName: 'Tara Reddy', activity: 'Yoga for Kids', teacher: 'Arjun Kapoor', city: 'Hyderabad', date: '2024-05-11', time: '9:00 AM', status: 'confirmed', amount: 350, createdAt: '2024-05-07' },
  { id: 'BK009', rawId: '', parentName: 'Lakshmi Rao', childName: 'Aditi Rao', activity: 'Watercolor Painting', teacher: 'Sneha Patel', city: 'Chennai', date: '2024-05-08', time: '2:00 PM', status: 'rescheduled', amount: 400, createdAt: '2024-05-02' },
  { id: 'BK010', rawId: '', parentName: 'Sanjay Joshi', childName: 'Veer Joshi', activity: 'Cooking Adventures', teacher: 'Meera Joshi', city: 'Ahmedabad', date: '2024-05-12', time: '11:00 AM', status: 'confirmed', amount: 650, createdAt: '2024-05-06' },
  { id: 'BK011', rawId: '', parentName: 'Pooja Iyer', childName: 'Ishaan Iyer', activity: 'Bharatanatyam', teacher: 'Ananya Reddy', city: 'Bangalore', date: '2024-05-04', time: '4:30 PM', status: 'completed', amount: 600, createdAt: '2024-04-28' },
  { id: 'BK012', rawId: '', parentName: 'Rajesh Kumar', childName: 'Kabir Kumar', activity: 'Guitar Lessons', teacher: null, city: 'Delhi', date: '2024-05-13', time: '10:00 AM', status: 'pending', amount: 500, createdAt: '2024-05-07' },
  { id: 'BK013', rawId: '', parentName: 'Priya Sharma', childName: 'Mia Sharma', activity: 'Science Experiments', teacher: 'Kiran Kumar', city: 'Mumbai', date: '2024-05-09', time: '3:30 PM', status: 'confirmed', amount: 500, createdAt: '2024-05-06' },
  { id: 'BK014', rawId: '', parentName: 'Anita Patel', childName: 'Rohan Patel', activity: 'Abacus Maths', teacher: 'Gaurav Tiwari', city: 'Bangalore', date: '2024-05-10', time: '5:00 PM', status: 'confirmed', amount: 450, createdAt: '2024-05-05' },
  { id: 'BK015', rawId: '', parentName: 'Kavya Nair', childName: 'Arya Nair', activity: 'Kathakali Dance', teacher: 'Divya Menon', city: 'Kochi', date: '2024-05-08', time: '6:30 PM', status: 'confirmed', amount: 600, createdAt: '2024-05-06' },
  { id: 'BK016', rawId: '', parentName: 'Meena Gupta', childName: 'Ravi Gupta', activity: 'Chess Basics', teacher: 'Gaurav Tiwari', city: 'Mumbai', date: '2024-05-03', time: '5:00 PM', status: 'completed', amount: 400, createdAt: '2024-04-26' },
  { id: 'BK017', rawId: '', parentName: 'Nisha Agarwal', childName: 'Kia Agarwal', activity: 'Yoga for Kids', teacher: 'Arjun Kapoor', city: 'Pune', date: '2024-05-07', time: '9:30 AM', status: 'completed', amount: 350, createdAt: '2024-04-30' },
  { id: 'BK018', rawId: '', parentName: 'Lakshmi Rao', childName: 'Sai Rao', activity: 'Carnatic Vocal', teacher: 'Preethi Subramaniam', city: 'Chennai', date: '2024-05-11', time: '4:00 PM', status: 'pending', amount: 550, createdAt: '2024-05-07' },
  { id: 'BK019', rawId: '', parentName: 'Vikram Singh', childName: 'Tia Singh', activity: 'Pottery Basics', teacher: null, city: 'Pune', date: '2024-05-14', time: '3:00 PM', status: 'pending', amount: 450, createdAt: '2024-05-07' },
  { id: 'BK020', rawId: '', parentName: 'Suresh Reddy', childName: 'Nik Reddy', activity: 'English Communication', teacher: 'Sameer Malhotra', city: 'Hyderabad', date: '2024-05-09', time: '7:00 PM', status: 'confirmed', amount: 500, createdAt: '2024-05-06' },
]

const CITIES = ['All Cities', ...Array.from(new Set(MOCK_BOOKINGS.map(b => b.city))).sort()]
const PAGE_SIZE = 10

export default function BookingsPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('all')
  const [city, setCity]           = useState('All Cities')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [page, setPage]           = useState(1)
  const [liveBookings, setLiveBookings] = useState<typeof MOCK_BOOKINGS | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    void (async () => {
      try {
        const data = await adminApi.bookings.list({ status: status === 'all' ? undefined : status, search: search || undefined, page, limit: 20 })
        setLiveBookings(data.items.map((b: any) => ({
          id: b.id.slice(0, 8).toUpperCase(),
          rawId: b.id,
          parentName: `${b.parentFirstName ?? ''} ${b.parentLastName ?? ''}`.trim(),
          childName: b.childFirstName ?? '—',
          activity: b.activityTitle ?? '—',
          teacher: null,
          city: b.parentCity ?? '—',
          date: b.scheduledAt ? new Date(b.scheduledAt).toISOString().split('T')[0] : '—',
          time: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
          status: b.status as BookingStatus,
          amount: Number(b.totalAmount),
          createdAt: new Date(b.createdAt).toISOString().split('T')[0],
        })))
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, status, search, page])

  const activeBookings = USE_MOCK_DATA ? MOCK_BOOKINGS : (liveBookings ?? MOCK_BOOKINGS)

  const filtered = useMemo(() => {
    return activeBookings.filter(b => {
      const matchSearch = !search || b.parentName.toLowerCase().includes(search.toLowerCase()) || b.childName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || b.status === status
      const matchCity   = city === 'All Cities' || b.city === city
      const matchFrom   = !dateFrom || b.date >= dateFrom
      const matchTo     = !dateTo   || b.date <= dateTo
      return matchSearch && matchStatus && matchCity && matchFrom && matchTo
    })
  }, [activeBookings, search, status, city, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = {
    total:     activeBookings.length,
    pending:   activeBookings.filter(b => b.status === 'pending').length,
    confirmed: activeBookings.filter(b => b.status === 'confirmed').length,
    revenue:   activeBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.amount, 0),
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exportCsv() {
    const rows = filtered
    const header = ['ID', 'Parent', 'Child', 'Activity', 'Teacher', 'City', 'Date', 'Time', 'Status', 'Amount']
    const lines = [
      header.join(','),
      ...rows.map(b => [b.id, b.parentName, b.childName, b.activity, b.teacher ?? '', b.city, b.date, b.time, b.status, b.amount].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function bulkCancel() {
    if (!selected.size) return
    const ids = [...selected].map(shortId => paged.find(b => b.id === shortId)?.rawId).filter(Boolean) as string[]
    if (!ids.length) return
    await Promise.allSettled(ids.map(id => adminApi.bookings.cancel(id)))
    setLiveBookings(prev => prev ? prev.map(b => ids.includes(b.rawId) ? { ...b, status: 'cancelled' as BookingStatus } : b) : null)
    setSelected(new Set())
  }

  function toggleAll() {
    if (selected.size === paged.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paged.map(b => b.id)))
    }
  }

  return (
    <div>
      <PageHeader title="Bookings" subtitle="All platform bookings — assign, reschedule, and manage">
        <button className="btn btn--secondary btn--sm" onClick={exportCsv}>Export CSV</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live booking data is unavailable. Showing demo bookings; assignment and cancellation actions should not be used." />}

      {/* KPI Cards */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Bookings', value: kpis.total, delta: '+8 this week', up: true, Icon: CalendarDays, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Pending Assignment', value: kpis.pending, delta: 'Needs teacher', up: false, Icon: AlertCircle, iconBg: '#FEF3C7', iconColor: '#B45309' },
            { label: 'Confirmed', value: kpis.confirmed, delta: 'Upcoming sessions', up: true, Icon: CheckCircle2, iconBg: '#DCFCE7', iconColor: '#16A34A' },
            { label: 'Revenue (Completed)', value: `₹${kpis.revenue.toLocaleString('en-IN')}`, delta: '+12% vs last month', up: true, Icon: IndianRupee, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
          ].map(k => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          background: 'var(--color-navy)', color: '#fff', padding: '10px 16px',
          borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
          <button className="btn btn--sm" style={{ background: 'var(--color-coral)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }} onClick={bulkCancel}>Cancel Selected</button>
          <button className="btn btn--ghost btn--sm" style={{ color: '#fff', marginLeft: 'auto' }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Filter + Table */}
      <div className="table-card">
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder="Search by booking ID, parent, or child…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
          <select className="filter-bar__select" value={city} onChange={e => { setCity(e.target.value); setPage(1) }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" className="filter-bar__select" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} title="From date" />
          <input type="date" className="filter-bar__select" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} title="To date" />
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} bookings</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} />
                </th>
                <th>Booking ID</th>
                <th>Parent / Child</th>
                <th>Activity</th>
                <th>Teacher</th>
                <th>City</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows count={8} cols={10} />}
              {!loading && paged.map(b => (
                <tr key={b.id} style={{ background: selected.has(b.id) ? 'var(--color-mint)' : undefined }}>
                  <td>
                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} />
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{b.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{b.parentName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{b.childName}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{b.activity}</td>
                  <td>
                    {b.teacher
                      ? <span style={{ fontSize: 13 }}>{b.teacher}</span>
                      : <span style={{ color: 'var(--color-coral)', fontSize: 13, fontWeight: 600 }}>Unassigned</span>
                    }
                  </td>
                  <td style={{ fontSize: 13 }}>{b.city}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.date}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{b.time}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>₹{b.amount}</td>
                  <td><span className={BOOKING_STATUS_BADGE[b.status].cls}>{BOOKING_STATUS_BADGE[b.status].label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/bookings/${b.id}`)}>View</button>
                      {b.teacher === null && b.status === 'pending' && b.rawId && (
                        <button
                          className="btn btn--sm"
                          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                          onClick={async () => {
                            const teacherId = prompt('Enter teacher user ID (UUID):')
                            if (!teacherId) return
                            try {
                              await adminApi.bookings.assign(b.rawId, { teacherId })
                              alert('Teacher assigned. Refresh to see changes.')
                            } catch {
                              alert('Assignment failed. Check the teacher ID and try again.')
                            }
                          }}
                        >Assign</button>
                      )}
                      {(b.status === 'pending' || b.status === 'confirmed') && b.rawId && (
                        <button
                          className="btn btn--sm"
                          style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                          onClick={async () => {
                            if (!confirm(`Cancel booking ${b.id}? This will also trigger a refund if payment was made.`)) return
                            try {
                              await adminApi.bookings.cancel(b.rawId)
                              alert('Booking cancelled.')
                            } catch {
                              alert('Cancellation failed.')
                            }
                          }}
                        >Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paged.length === 0 && (
                <tr><td colSpan={10} className="empty-state">No bookings match your filters.</td></tr>
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
    </div>
  )
}
