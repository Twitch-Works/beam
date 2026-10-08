'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WeeklyAvailability } from '@beam/schemas'
import {
  teacherApi,
  type ChangeRequestRow,
  type TeacherActivityRow,
  type TeacherSessionRow,
  type TeacherSlotRow,
} from '@/lib/api'
import { useTeacherId } from '@/lib/useTeacherId'
import { formatInr } from '@/lib/formatters'
import { AvailabilityPanel } from './AvailabilityPanel'
import { ClassTimesPanel } from './ClassTimesPanel'
import { UpcomingBookingsPanel } from './UpcomingBookingsPanel'

type Tab = 'bookings' | 'classes' | 'availability' | 'past'

type ScheduleData = {
  availability: WeeklyAvailability | null
  sessions: TeacherSessionRow[]
  slots: TeacherSlotRow[]
  activities: TeacherActivityRow[]
  requests: ChangeRequestRow[]
}

export default function MySchedulePage() {
  const teacherId = useTeacherId()
  const [tab, setTab] = useState<Tab>('bookings')
  const [data, setData] = useState<ScheduleData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!teacherId) return
    try {
      const [avail, sess, slots, activities, requests] = await Promise.all([
        teacherApi.availability.get(teacherId),
        teacherApi.sessions.list(teacherId),
        teacherApi.slots.list(teacherId),
        teacherApi.activities.list(teacherId),
        teacherApi.changeRequests.list(teacherId),
      ])
      setData({
        availability: avail.availability,
        sessions: sess.items,
        slots: slots.items,
        activities: activities.items,
        requests: requests.items,
      })
      setError(null)
    } catch {
      setError('Could not load your schedule.')
    }
  }, [teacherId])

  useEffect(() => {
    load()
  }, [load])

  if (!data || !teacherId) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>My Schedule</h1>
            <p className="dashboard-hero__sub">{error ?? 'Loading your schedule…'}</p>
          </div>
        </div>
      </div>
    )
  }

  const pendingRequests = data.requests.filter((r) => r.status === 'pending').length
  const openSlots = data.slots.filter((s) => !s.bookingId && s.isAvailable).length
  // Anything finished, plus bookings whose time has passed without being closed out
  const now = Date.now()
  const past = data.sessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled' || (s.scheduledAt && new Date(s.scheduledAt).getTime() <= now),
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bookings', label: pendingRequests ? `Upcoming Bookings (${pendingRequests} pending)` : 'Upcoming Bookings' },
    { id: 'classes', label: `My Classes (${openSlots} open)` },
    { id: 'availability', label: 'Weekly Availability' },
    { id: 'past', label: 'Past Sessions' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Schedule</h1>
          <p className="dashboard-hero__sub">Plan your class times, track bookings, and request changes.</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab-btn${tab === t.id ? ' tab-btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <UpcomingBookingsPanel teacherId={teacherId} sessions={data.sessions} slots={data.slots} requests={data.requests} onChanged={load} />
      )}
      {tab === 'classes' && (
        <ClassTimesPanel teacherId={teacherId} activities={data.activities} slots={data.slots} onChanged={load} />
      )}
      {tab === 'availability' && <AvailabilityPanel teacherId={teacherId} initial={data.availability} />}
      {tab === 'past' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
            <h2 className="section-card__title">Past Sessions</h2>
          </div>
          <SessionsTable rows={past} emptyText="No past sessions yet." />
        </div>
      )}
    </div>
  )
}

function SessionsTable({ rows, emptyText }: { rows: TeacherSessionRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p style={{ padding: 'var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>{emptyText}</p>
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Child</th>
            <th>Activity</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}
              </td>
              <td style={{ fontSize: 13 }}>{[s.childFirstName, s.childLastName].filter(Boolean).join(' ') || '—'}</td>
              <td style={{ fontSize: 13 }}>{s.activityTitle ?? '—'}</td>
              <td className="cell-mono">{s.totalAmount ? formatInr(Number(s.totalAmount)) : '—'}</td>
              <td><span className={`badge badge--${s.status}`} style={{ textTransform: 'capitalize' }}>{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
