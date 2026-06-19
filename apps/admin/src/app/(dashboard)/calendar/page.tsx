'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard, SkeletonLine } from '@/components/Skeleton'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'rescheduled' | 'in_progress'

interface CalBooking {
  id: string
  parentName: string
  childName: string
  activity: string
  date: string
  status: BookingStatus
  time: string
}

const MOCK_BOOKINGS: CalBooking[] = [
  { id: 'BK001', parentName: 'Priya Sharma',  childName: 'Aarav Sharma',  activity: 'Yoga for Kids',        date: '2026-05-08', time: '10:00 AM', status: 'confirmed'  },
  { id: 'BK002', parentName: 'Rahul Mehta',   childName: 'Riya Mehta',    activity: 'Beginner Guitar',      date: '2026-05-08', time: '11:30 AM', status: 'confirmed'  },
  { id: 'BK003', parentName: 'Anita Patel',   childName: 'Karan Patel',   activity: 'Bharatanatyam',        date: '2026-05-12', time: '4:00 PM',  status: 'completed'  },
  { id: 'BK004', parentName: 'Meena Gupta',   childName: 'Sia Gupta',     activity: 'Watercolor Painting',  date: '2026-05-14', time: '3:00 PM',  status: 'pending'    },
  { id: 'BK005', parentName: 'Vikram Singh',  childName: 'Aryan Singh',   activity: 'Scratch Coding',       date: '2026-05-15', time: '10:00 AM', status: 'pending'    },
  { id: 'BK006', parentName: 'Nisha Agarwal', childName: 'Zara Agarwal',  activity: 'Carnatic Vocal',       date: '2026-05-12', time: '5:30 PM',  status: 'completed'  },
  { id: 'BK007', parentName: 'Deepa Krishnan',childName: 'Dev Krishnan',  activity: 'Chess Basics',         date: '2026-05-05', time: '6:00 PM',  status: 'cancelled'  },
  { id: 'BK008', parentName: 'Suresh Reddy',  childName: 'Tara Reddy',    activity: 'Yoga for Kids',        date: '2026-05-20', time: '9:00 AM',  status: 'confirmed'  },
  { id: 'BK009', parentName: 'Lakshmi Rao',   childName: 'Aditi Rao',     activity: 'Watercolor Painting',  date: '2026-05-18', time: '2:00 PM',  status: 'rescheduled'},
  { id: 'BK010', parentName: 'Sanjay Joshi',  childName: 'Veer Joshi',    activity: 'Cooking Adventures',   date: '2026-05-22', time: '11:00 AM', status: 'confirmed'  },
  { id: 'BK011', parentName: 'Pooja Iyer',    childName: 'Ishaan Iyer',   activity: 'Bharatanatyam',        date: '2026-05-27', time: '4:30 PM',  status: 'completed'  },
  { id: 'BK012', parentName: 'Rajesh Kumar',  childName: 'Kabir Kumar',   activity: 'Guitar Lessons',       date: '2026-05-28', time: '10:00 AM', status: 'pending'    },
  { id: 'BK013', parentName: 'Priya Sharma',  childName: 'Mia Sharma',    activity: 'Science Experiments',  date: '2026-05-14', time: '3:30 PM',  status: 'confirmed'  },
  { id: 'BK014', parentName: 'Anita Patel',   childName: 'Rohan Patel',   activity: 'Abacus Maths',         date: '2026-05-21', time: '5:00 PM',  status: 'confirmed'  },
  { id: 'BK015', parentName: 'Kavya Nair',    childName: 'Arya Nair',     activity: 'Kathakali Dance',      date: '2026-05-08', time: '6:30 PM',  status: 'confirmed'  },
]

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  confirmed:   { bg: '#DCFCE7', text: '#166534' },
  completed:   { bg: '#E5F7F4', text: '#0F4C5C' },
  cancelled:   { bg: '#FEE2E2', text: '#991B1B' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8' },
  pending:     { bg: '#FEF3C7', text: '#92400E' },
  rescheduled: { bg: '#EDE9FE', text: '#5B21B6' },
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Mon=0 … Sun=6
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [bookings, setBookings] = useState<CalBooking[]>(MOCK_BOOKINGS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (USE_MOCK_DATA) { setLoading(false); setBookings(MOCK_BOOKINGS); return }
    setLoading(true)
    void (async () => {
      try {
        const data = await adminApi.bookings.list({ limit: 200 })
        const mapped: CalBooking[] = (data.items ?? []).map((b: any) => ({
          id: b.id,
          parentName: `${b.parentFirstName ?? ''} ${b.parentLastName ?? ''}`.trim() || '—',
          childName: b.childFirstName ?? '—',
          activity: b.activityTitle ?? '—',
          date: b.scheduledAt
            ? new Date(b.scheduledAt).toISOString().split('T')[0]
            : (b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : ''),
          time: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          status: (b.status ?? 'pending') as BookingStatus,
        }))
        if (mapped.length > 0) setBookings(mapped)
      } catch {}
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA])

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const daysInMonth    = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfWeek(year, month)
  const totalCells     = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7

  const byDate = useMemo(() => {
    const map: Record<string, CalBooking[]> = {}
    for (const b of bookings) {
      if (!b.date) continue
      if (!map[b.date]) map[b.date] = []
      map[b.date].push(b)
    }
    return map
  }, [bookings])

  const monthBookings = useMemo(() =>
    bookings.filter(b => {
      if (!b.date) return false
      const [y, m] = b.date.split('-').map(Number)
      return y === year && m === month + 1
    }), [bookings, year, month])

  function prevMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  return (
    <div>

            <PageHeader title="Calendar" subtitle="All upcoming sessions at a glance">
       <button className="btn btn--secondary btn--sm" onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </button>            </PageHeader>
      

      {/* KPI strip */}
      {loading ? (
        <div className="kpi-grid kpi-grid--4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid--4">
          {[
            { label: 'This Month',  value: monthBookings.length,                                         delta: 'All statuses',    up: true,  Icon: CalendarDays,  iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
            { label: 'Confirmed',   value: monthBookings.filter(b => b.status === 'confirmed').length,  delta: 'Upcoming sessions', up: true,  Icon: CheckCircle2,  iconBg: '#DCFCE7',          iconColor: '#16A34A' },
            { label: 'Pending',     value: monthBookings.filter(b => b.status === 'pending').length,    delta: 'Needs teacher',   up: false, Icon: AlertCircle,   iconBg: '#FEF3C7',          iconColor: '#B45309' },
            { label: 'Completed',   value: monthBookings.filter(b => b.status === 'completed').length,  delta: 'Sessions done',   up: true,  Icon: CheckCheck,    iconBg: '#E5F7F4',          iconColor: '#0F4C5C' },
          ].map(k => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={prevMonth} className="btn btn--ghost btn--sm" style={{ fontSize: 18, padding: '4px 12px' }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-navy)' }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="btn btn--ghost btn--sm" style={{ fontSize: 18, padding: '4px 12px' }}>›</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-gray-text)', letterSpacing: 0.5 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {loading ? Array.from({ length: 35 }, (_, i) => (
            <div key={i} style={{
              minHeight: 110, padding: '6px 8px',
              borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--color-border)' : undefined,
              borderBottom: i < 28 ? '1px solid var(--color-border)' : undefined,
            }}>
              <SkeletonLine width={26} height={26} style={{ borderRadius: '50%', marginBottom: 6 }} />
              {i % 3 === 0 && <SkeletonLine height={14} width="88%" style={{ marginBottom: 3 }} />}
              {i % 5 === 1 && <SkeletonLine height={14} width="72%" />}
            </div>
          )) : Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - firstDayOffset + 1
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
            const dateStr = isCurrentMonth ? toDateStr(year, month, dayNum) : ''
            const dayBookings = dateStr ? (byDate[dateStr] ?? []) : []
            const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
            const isToday = dateStr === todayStr
            const isWeekend = i % 7 >= 5

            return (
              <div
                key={i}
                style={{
                  minHeight: 110,
                  padding: '6px 8px',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--color-border)' : undefined,
                  borderBottom: i < totalCells - 7 ? '1px solid var(--color-border)' : undefined,
                  background: !isCurrentMonth ? '#FAFAFA' : isWeekend ? '#FDFCFF' : '#fff',
                }}
              >
                {isCurrentMonth && (
                  <>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: '50%', marginBottom: 4,
                      background: isToday ? 'var(--color-primary)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--color-navy)',
                      fontSize: 13, fontWeight: isToday ? 700 : 500,
                    }}>
                      {dayNum}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayBookings.slice(0, 3).map(b => (
                        <div
                          key={b.id}
                          onClick={() => router.push(`/bookings/${b.id}`)}
                          title={`${b.time} · ${b.childName} · ${b.activity}`}
                          style={{
                            fontSize: 11, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                            background: STATUS_COLORS[b.status]?.bg ?? '#F1F5F9',
                            color: STATUS_COLORS[b.status]?.text ?? '#1E293B',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                        >
                          {b.time ? `${b.time} ` : ''}{b.childName}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, paddingLeft: 4 }}>
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {(Object.entries(STATUS_COLORS) as [BookingStatus, { bg: string; text: string }][]).map(([status, colors]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: colors.bg, border: `1px solid ${colors.text}22` }} />
            <span style={{ color: 'var(--color-gray-text)', textTransform: 'capitalize' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
