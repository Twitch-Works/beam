'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonTableRows } from '@/components/Skeleton'
import { Palette, Globe, FileEdit, CalendarCheck, List, LayoutGrid } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'
import { ACTIVITY_STATUS_BADGE } from '@/lib/status-badges'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Dance:          { bg: '#FF7A59', color: '#fff' },
  Music:          { bg: '#A7BBFA', color: '#1E293B' },
  Art:            { bg: '#FCB857', color: '#1E293B' },
  Wellness:       { bg: '#1787A6', color: '#fff' },
  Technology:     { bg: '#2563EB', color: '#fff' },
  'Mental Sports':{ bg: '#7C3AED', color: '#fff' },
  'Life Skills':  { bg: '#16A34A', color: '#fff' },
  STEM:           { bg: '#EA580C', color: '#fff' },
  Theatre:        { bg: '#DB2777', color: '#fff' },
  Language:       { bg: '#0891B2', color: '#fff' },
}

// TODO: replace with useActivities() hook from @beam/hooks/admin
// import { useActivities } from '@beam/hooks/admin'

type ActivityStatus = 'published' | 'draft' | 'archived'

interface Activity {
  id: string
  title: string
  category: string
  ageGroup: string
  pricePerSession: number
  status: ActivityStatus
  totalBookings: number
  avgRating: number
  teacherCount: number
  createdAt: string
  updatedAt: string
  imageUrl: string
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: 'ACT001', title: 'Classical Bharatanatyam', category: 'Dance', ageGroup: '6–12', pricePerSession: 600, status: 'published', totalBookings: 342, avgRating: 4.9, teacherCount: 8, createdAt: '2023-06-01', updatedAt: '2024-04-20', imageUrl: 'https://picsum.photos/seed/dance1/400/200' },
  { id: 'ACT002', title: 'Beginner Guitar Lessons', category: 'Music', ageGroup: '8–16', pricePerSession: 500, status: 'published', totalBookings: 287, avgRating: 4.8, teacherCount: 6, createdAt: '2023-07-15', updatedAt: '2024-05-01', imageUrl: 'https://picsum.photos/seed/guitar1/400/200' },
  { id: 'ACT003', title: 'Watercolor Painting', category: 'Art', ageGroup: '4–10', pricePerSession: 400, status: 'published', totalBookings: 198, avgRating: 4.7, teacherCount: 5, createdAt: '2023-08-10', updatedAt: '2024-04-18', imageUrl: 'https://picsum.photos/seed/painting1/400/200' },
  { id: 'ACT004', title: 'Yoga for Kids', category: 'Wellness', ageGroup: '5–14', pricePerSession: 350, status: 'published', totalBookings: 412, avgRating: 4.9, teacherCount: 10, createdAt: '2023-05-20', updatedAt: '2024-05-03', imageUrl: 'https://picsum.photos/seed/yoga1/400/200' },
  { id: 'ACT005', title: 'Scratch Coding (Beginners)', category: 'Technology', ageGroup: '7–12', pricePerSession: 700, status: 'published', totalBookings: 156, avgRating: 4.6, teacherCount: 4, createdAt: '2023-10-01', updatedAt: '2024-04-25', imageUrl: 'https://picsum.photos/seed/coding1/400/200' },
  { id: 'ACT006', title: 'Carnatic Vocal Training', category: 'Music', ageGroup: '6–15', pricePerSession: 550, status: 'published', totalBookings: 223, avgRating: 4.8, teacherCount: 7, createdAt: '2023-09-05', updatedAt: '2024-05-02', imageUrl: 'https://picsum.photos/seed/music2/400/200' },
  { id: 'ACT007', title: 'Clay Pottery Basics', category: 'Art', ageGroup: '8–14', pricePerSession: 450, status: 'published', totalBookings: 89, avgRating: 4.5, teacherCount: 3, createdAt: '2024-01-12', updatedAt: '2024-04-10', imageUrl: 'https://picsum.photos/seed/pottery1/400/200' },
  { id: 'ACT008', title: 'Chess for Beginners', category: 'Mental Sports', ageGroup: '6–14', pricePerSession: 400, status: 'published', totalBookings: 167, avgRating: 4.7, teacherCount: 5, createdAt: '2023-11-08', updatedAt: '2024-04-28', imageUrl: 'https://picsum.photos/seed/chess1/400/200' },
  { id: 'ACT009', title: 'Hip-Hop Dance Workshop', category: 'Dance', ageGroup: '8–16', pricePerSession: 600, status: 'draft', totalBookings: 0, avgRating: 0, teacherCount: 0, createdAt: '2024-04-30', updatedAt: '2024-05-05', imageUrl: 'https://picsum.photos/seed/dance2/400/200' },
  { id: 'ACT010', title: 'Cooking Adventures', category: 'Life Skills', ageGroup: '8–14', pricePerSession: 650, status: 'published', totalBookings: 134, avgRating: 4.6, teacherCount: 4, createdAt: '2023-12-15', updatedAt: '2024-04-20', imageUrl: 'https://picsum.photos/seed/cooking1/400/200' },
  { id: 'ACT011', title: 'Science Experiments at Home', category: 'STEM', ageGroup: '6–12', pricePerSession: 500, status: 'published', totalBookings: 201, avgRating: 4.8, teacherCount: 6, createdAt: '2023-10-22', updatedAt: '2024-05-04', imageUrl: 'https://picsum.photos/seed/science1/400/200' },
  { id: 'ACT012', title: 'Robotics Explorers', category: 'Technology', ageGroup: '10–16', pricePerSession: 800, status: 'draft', totalBookings: 0, avgRating: 0, teacherCount: 0, createdAt: '2024-05-01', updatedAt: '2024-05-06', imageUrl: 'https://picsum.photos/seed/robotics1/400/200' },
  { id: 'ACT013', title: 'Abacus and Mental Maths', category: 'Mental Sports', ageGroup: '5–10', pricePerSession: 450, status: 'published', totalBookings: 278, avgRating: 4.7, teacherCount: 8, createdAt: '2023-07-01', updatedAt: '2024-04-30', imageUrl: 'https://picsum.photos/seed/maths1/400/200' },
  { id: 'ACT014', title: 'Storytelling and Drama', category: 'Theatre', ageGroup: '5–12', pricePerSession: 400, status: 'archived', totalBookings: 45, avgRating: 4.2, teacherCount: 0, createdAt: '2023-04-10', updatedAt: '2024-02-01', imageUrl: 'https://picsum.photos/seed/theatre1/400/200' },
  { id: 'ACT015', title: 'English Communication Skills', category: 'Language', ageGroup: '7–14', pricePerSession: 500, status: 'published', totalBookings: 189, avgRating: 4.6, teacherCount: 5, createdAt: '2023-11-20', updatedAt: '2024-05-01', imageUrl: 'https://picsum.photos/seed/school1/400/200' },
]

const STATIC_CATEGORIES = ['All Categories', ...Array.from(new Set(MOCK_ACTIVITIES.map(a => a.category))).sort()]
const PAGE_SIZE = 10

function Stars({ rating }: { rating: number }) {
  if (rating === 0) return <span style={{ color: 'var(--color-gray)', fontSize: 12 }}>—</span>
  return (
    <span style={{ color: 'var(--color-yellow)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      ★ {rating.toFixed(1)}
    </span>
  )
}

export default function ActivitiesPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('all')
  const [category, setCategory] = useState('All Categories')
  const [page, setPage]         = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [liveActivities, setLiveActivities] = useState<Activity[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [rowPending, setRowPending] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    void (async () => {
      try {
        const res = await adminApi.activities.list({ status: status === 'all' ? undefined : status, search: search || undefined, page })
        setLiveActivities(res.items.map((a: any) => ({
          id: a.id,
          title: a.title,
          category: a.categoryName ?? a.category ?? 'Uncategorised',
          ageGroup: a.ageGroup ?? a.age_group ?? '—',
          pricePerSession: Number(a.pricePerSession ?? a.price_per_session ?? 0),
          status: a.status as ActivityStatus,
          totalBookings: Number(a.totalBookings ?? a.total_bookings ?? 0),
          avgRating: Number(a.avgRating ?? a.avg_rating ?? 0),
          teacherCount: Number(a.teacherCount ?? a.teacher_count ?? 0),
          createdAt: a.createdAt ?? a.created_at ?? '',
          updatedAt: a.updatedAt ?? a.updated_at ?? '',
          imageUrl: a.imageUrl ?? a.image_url ?? '',
        })))
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA, status, search, page])

  const activeActivities = USE_MOCK_DATA ? MOCK_ACTIVITIES : (liveActivities ?? MOCK_ACTIVITIES)

  const filtered = useMemo(() => {
    if (liveActivities) return activeActivities
    return MOCK_ACTIVITIES.filter(a => {
      const matchSearch   = !search || a.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus   = status === 'all' || a.status === status
      const matchCategory = category === 'All Categories' || a.category === category
      return matchSearch && matchStatus && matchCategory
    })
  }, [activeActivities, liveActivities, search, status, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = {
    total:     activeActivities.length,
    published: activeActivities.filter(a => a.status === 'published').length,
    drafts:    activeActivities.filter(a => a.status === 'draft').length,
    totalBookings: activeActivities.reduce((s, a) => s + a.totalBookings, 0),
  }

  async function handlePublish(id: string) {
    setRowPending(p => ({ ...p, [id]: true }))
    try {
      await adminApi.activities.publish(id)
      setLiveActivities(prev => prev
        ? prev.map(a => a.id === id ? { ...a, status: 'published' as ActivityStatus } : a)
        : null
      )
    } catch { /* show nothing — banner already covers API unavailability */ }
    finally { setRowPending(p => ({ ...p, [id]: false })) }
  }

  async function handleArchive(id: string) {
    setRowPending(p => ({ ...p, [id]: true }))
    try {
      await adminApi.activities.archive(id)
      setLiveActivities(prev => prev
        ? prev.map(a => a.id === id ? { ...a, status: 'archived' as ActivityStatus } : a)
        : null
      )
    } catch { /* show nothing */ }
    finally { setRowPending(p => ({ ...p, [id]: false })) }
  }

  return (
    <div>
      <PageHeader title="Activities" subtitle="Curriculum, pricing, and publish controls">
        {/* TODO: POST /api/admin/activities */}
        <button className="btn btn--primary btn--sm" onClick={() => router.push('/activities/new')}>+ New Activity</button>
      </PageHeader>
      {apiUnavailable && <ApiFallbackBanner message="Live activity data is unavailable. Showing demo activities; publish/archive actions are not connected." />}

      {/* KPI Cards */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'Total Activities', value: kpis.total, delta: '+2 this month', up: true, Icon: Palette, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Published', value: kpis.published, delta: 'Live on platform', up: true, Icon: Globe, iconBg: '#DCFCE7', iconColor: '#16A34A' },
            { label: 'Drafts', value: kpis.drafts, delta: 'Pending publish', up: false, Icon: FileEdit, iconBg: '#FEF3C7', iconColor: '#B45309' },
            { label: 'Total Bookings', value: kpis.totalBookings.toLocaleString('en-IN'), delta: 'Across all activities', up: true, Icon: CalendarCheck, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
          ].map(k => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Filter + Table / Grid */}
      <div className="table-card">
        {/* Filter bar */}
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            placeholder="Search activity title…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <select className="filter-bar__select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select className="filter-bar__select" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
            {STATIC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="filter-bar__spacer" />
          <span className="filter-bar__count">{filtered.length} activities</span>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 12, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['table', 'grid'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '6px 10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  background: viewMode === m ? 'var(--color-primary)' : '#fff',
                  color: viewMode === m ? '#fff' : 'var(--color-gray)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'table' ? <List size={15} /> : <LayoutGrid size={15} />}
              </button>
            ))}
          </div>
        </div>

        {/* Table view */}
        {viewMode === 'table' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Image</th>
                  <th>Activity</th>
                  <th>Category</th>
                  <th>Age Group</th>
                  <th>Price / Session</th>
                  <th>Bookings</th>
                  <th>Avg Rating</th>
                  <th>Teachers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonTableRows count={8} cols={10} />}
                {!loading && paged.map(a => {
                  const cat = CATEGORY_COLORS[a.category] ?? { bg: '#E2E8F0', color: '#64748B' }
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: cat.bg }}>
                          <img src={a.imageUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>{a.id}</div>
                      </td>
                      <td><span className="tag">{a.category}</span></td>
                      <td style={{ fontSize: 13 }}>{a.ageGroup} yrs</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>₹{a.pricePerSession}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{a.totalBookings}</td>
                      <td><Stars rating={a.avgRating} /></td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{a.teacherCount || '—'}</td>
                      <td><span className={ACTIVITY_STATUS_BADGE[a.status].cls}>{ACTIVITY_STATUS_BADGE[a.status].label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/activities/${a.id}`)}>Edit</button>
                          {a.status === 'draft' && (
                            <button className="btn btn--sm" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: rowPending[a.id] ? 'not-allowed' : 'pointer', opacity: rowPending[a.id] ? 0.6 : 1 }} disabled={rowPending[a.id]} onClick={() => handlePublish(a.id)}>
                              {rowPending[a.id] ? '…' : 'Publish'}
                            </button>
                          )}
                          {a.status === 'published' && (
                            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-gray)', opacity: rowPending[a.id] ? 0.6 : 1 }} disabled={rowPending[a.id]} onClick={() => handleArchive(a.id)}>
                              {rowPending[a.id] ? '…' : 'Archive'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && paged.length === 0 && (
                  <tr><td colSpan={10} className="empty-state">No activities match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div style={{ padding: 24 }}>
            {paged.length === 0 ? (
              <div className="empty-state">No activities match your filters.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {paged.map(a => {
                  const cat = CATEGORY_COLORS[a.category] ?? { bg: '#E2E8F0', color: '#64748B' }
                  return (
                    <div key={a.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                      {/* Image area */}
                      <div style={{ height: 140, background: cat.bg, position: 'relative', overflow: 'hidden' }}>
                        <img src={a.imageUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                          <span className={ACTIVITY_STATUS_BADGE[a.status].cls}>{ACTIVITY_STATUS_BADGE[a.status].label}</span>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{a.title}</div>
                        </div>
                      </div>
                      {/* Card body */}
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span className="tag">{a.category}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{a.ageGroup} yrs</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)', fontSize: 15 }}>₹{a.pricePerSession}</span>
                          <Stars rating={a.avgRating} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray)', marginBottom: 12 }}>
                          {a.totalBookings} bookings · {a.teacherCount || 0} teachers
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => router.push(`/activities/${a.id}`)}>Edit</button>
                          {a.status === 'draft' && (
                            <button className="btn btn--sm" style={{ flex: 1, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: rowPending[a.id] ? 'not-allowed' : 'pointer', opacity: rowPending[a.id] ? 0.6 : 1 }} disabled={rowPending[a.id]} onClick={() => handlePublish(a.id)}>
                              {rowPending[a.id] ? '…' : 'Publish'}
                            </button>
                          )}
                          {a.status === 'published' && (
                            <button className="btn btn--ghost btn--sm" style={{ flex: 1, color: 'var(--color-gray)', opacity: rowPending[a.id] ? 0.6 : 1 }} disabled={rowPending[a.id]} onClick={() => handleArchive(a.id)}>
                              {rowPending[a.id] ? '…' : 'Archive'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="pagination" style={{ borderTop: '1px solid var(--color-border)' }}>
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
