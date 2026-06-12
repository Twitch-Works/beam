'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { useRouter } from 'next/navigation'
import { Users, UserCheck, Sparkles, Baby } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { USER_STATUS_BADGE } from '@/lib/status-badges'

type UserStatus = 'active' | 'inactive' | 'suspended'

interface User {
  id: string
  name: string
  email: string
  phone: string
  childrenCount: number
  city: string
  joinDate: string
  lastActive: string
  status: UserStatus
  totalBookings: number
}

const MOCK_USERS: User[] = [
  { id: 'U001', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+91 98765 43210', childrenCount: 2, city: 'Mumbai', joinDate: '2024-03-12', lastActive: '2024-05-07', status: 'active', totalBookings: 14 },
  { id: 'U002', name: 'Rahul Mehta', email: 'rahul.mehta@gmail.com', phone: '+91 87654 32109', childrenCount: 1, city: 'Delhi', joinDate: '2024-01-08', lastActive: '2024-05-06', status: 'active', totalBookings: 8 },
  { id: 'U003', name: 'Anita Patel', email: 'anita.patel@outlook.com', phone: '+91 76543 21098', childrenCount: 3, city: 'Bangalore', joinDate: '2023-11-20', lastActive: '2024-04-30', status: 'active', totalBookings: 22 },
  { id: 'U004', name: 'Vikram Singh', email: 'vikram.singh@yahoo.com', phone: '+91 65432 10987', childrenCount: 2, city: 'Pune', joinDate: '2024-02-15', lastActive: '2024-05-01', status: 'active', totalBookings: 6 },
  { id: 'U005', name: 'Deepa Krishnan', email: 'deepa.k@gmail.com', phone: '+91 54321 09876', childrenCount: 1, city: 'Chennai', joinDate: '2023-09-05', lastActive: '2024-03-22', status: 'inactive', totalBookings: 3 },
  { id: 'U006', name: 'Suresh Reddy', email: 'suresh.r@gmail.com', phone: '+91 43210 98765', childrenCount: 2, city: 'Hyderabad', joinDate: '2024-04-01', lastActive: '2024-05-07', status: 'active', totalBookings: 4 },
  { id: 'U007', name: 'Kavya Nair', email: 'kavya.nair@gmail.com', phone: '+91 32109 87654', childrenCount: 1, city: 'Kochi', joinDate: '2024-03-28', lastActive: '2024-05-05', status: 'active', totalBookings: 2 },
  { id: 'U008', name: 'Arun Verma', email: 'arun.verma@gmail.com', phone: '+91 21098 76543', childrenCount: 2, city: 'Jaipur', joinDate: '2023-12-10', lastActive: '2024-02-14', status: 'inactive', totalBookings: 5 },
  { id: 'U009', name: 'Meena Gupta', email: 'meena.gupta@gmail.com', phone: '+91 10987 65432', childrenCount: 3, city: 'Mumbai', joinDate: '2023-08-22', lastActive: '2024-05-04', status: 'active', totalBookings: 31 },
  { id: 'U010', name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', phone: '+91 99876 54321', childrenCount: 1, city: 'Delhi', joinDate: '2024-04-18', lastActive: '2024-05-07', status: 'active', totalBookings: 1 },
  { id: 'U011', name: 'Pooja Iyer', email: 'pooja.iyer@gmail.com', phone: '+91 88765 43210', childrenCount: 2, city: 'Bangalore', joinDate: '2023-10-03', lastActive: '2024-04-20', status: 'suspended', totalBookings: 9 },
  { id: 'U012', name: 'Sanjay Joshi', email: 'sanjay.j@gmail.com', phone: '+91 77654 32109', childrenCount: 1, city: 'Ahmedabad', joinDate: '2024-01-25', lastActive: '2024-05-03', status: 'active', totalBookings: 7 },
  { id: 'U013', name: 'Lakshmi Rao', email: 'lakshmi.rao@gmail.com', phone: '+91 66543 21098', childrenCount: 2, city: 'Chennai', joinDate: '2023-07-14', lastActive: '2024-05-06', status: 'active', totalBookings: 18 },
  { id: 'U014', name: 'Mohan Das', email: 'mohan.das@gmail.com', phone: '+91 55432 10987', childrenCount: 1, city: 'Kolkata', joinDate: '2024-02-29', lastActive: '2024-03-10', status: 'inactive', totalBookings: 2 },
  { id: 'U015', name: 'Nisha Agarwal', email: 'nisha.a@gmail.com', phone: '+91 44321 09876', childrenCount: 3, city: 'Pune', joinDate: '2023-06-01', lastActive: '2024-05-07', status: 'active', totalBookings: 27 },
]


const CITIES = ['All Cities', ...Array.from(new Set(MOCK_USERS.map(u => u.city))).sort()]
const PAGE_SIZE = 10

export default function UsersPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('all')
  const [city, setCity]         = useState('All Cities')
  const [page, setPage]         = useState(1)
  const [liveUsers, setLiveUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    void (async () => {
      try {
        const data = await adminApi.users.list({ search: search || undefined, page })
        setLiveUsers(data.items.map((u: any) => ({
          id: u.id,
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
          email: u.email ?? '—',
          phone: u.phone ?? '—',
          childrenCount: Number(u.childCount ?? 0),
          city: u.city ?? '—',
          joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '—',
          lastActive: u.updatedAt ? new Date(u.updatedAt).toISOString().split('T')[0] : '—',
          status: (u.status ?? 'active') as UserStatus,
          totalBookings: Number(u.bookingCount ?? 0),
        })))
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, search, page])

  const activeUsers = USE_MOCK_DATA ? MOCK_USERS : (liveUsers ?? MOCK_USERS)

  const filtered = useMemo(() => {
    return activeUsers.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || u.status === status
      const matchCity   = city === 'All Cities' || u.city === city
      return matchSearch && matchStatus && matchCity
    })
  }, [activeUsers, search, status, city])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = {
    totalParents:   activeUsers.length,
    activeMonth:    activeUsers.filter(u => u.status === 'active').length,
    newThisWeek:    3,
    totalKids:      activeUsers.reduce((s, u) => s + u.childrenCount, 0),
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Parent accounts and linked children">
        <button className="btn btn--secondary btn--sm" onClick={() => alert('CSV export coming soon.')}>Export CSV</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live user data is unavailable. Showing demo users; account actions should be treated as unavailable." />}

      {/* KPI Strip */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Parents', value: kpis.totalParents, delta: '+12% vs last month', up: true, Icon: Users, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Active This Month', value: kpis.activeMonth, delta: '+5% vs last month', up: true, Icon: UserCheck, iconBg: '#DCFCE7', iconColor: '#16A34A' },
            { label: 'New This Week', value: kpis.newThisWeek, delta: '+2 vs last week', up: true, Icon: Sparkles, iconBg: '#FEF3C7', iconColor: '#B45309' },
            { label: 'Total Kids Registered', value: kpis.totalKids, delta: `Avg ${(kpis.totalKids / kpis.totalParents).toFixed(1)} per parent`, up: true, Icon: Baby, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
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
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className="filter-bar__select" value={city} onChange={e => { setCity(e.target.value); setPage(1) }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} users</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Email</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Kids</th>
                <th>City</th>
                <th>Bookings</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows count={8} cols={10} />}
              {!loading && paged.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--color-mint)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0
                      }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>{u.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{u.email}</td>
                  <td style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{u.phone}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{u.childrenCount}</td>
                  <td style={{ fontSize: 13 }}>{u.city}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>{u.totalBookings}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{u.joinDate}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{u.lastActive}</td>
                  <td><span className={USER_STATUS_BADGE[u.status].cls}>{USER_STATUS_BADGE[u.status].label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/users/${u.id}`)}>View</button>
                      {u.status === 'suspended'
                        ? <button className="btn btn--secondary btn--sm" onClick={() => alert('Restore user coming soon.')}>Restore</button>
                        : <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }} onClick={() => alert('Suspend user coming soon.')}>Suspend</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paged.length === 0 && (
                <tr><td colSpan={10} className="empty-state">No users match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${page === p ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  )
}
