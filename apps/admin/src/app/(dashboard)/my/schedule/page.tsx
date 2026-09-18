'use client'

import { useEffect, useState } from 'react'
import { teacherApi, type TeacherSessionRow } from '@/lib/api'
import { useTeacherId } from '@/lib/useTeacherId'
import { formatInr } from '@/lib/formatters'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function toRows(availability: Record<string, string[]> | null): Record<string, string> {
  const rows: Record<string, string> = {}
  for (const day of WEEKDAYS) rows[day] = (availability?.[day] ?? []).join(', ')
  return rows
}

export default function MySchedulePage() {
  const teacherId = useTeacherId()
  const [rows, setRows] = useState<Record<string, string> | null>(null)
  const [sessions, setSessions] = useState<TeacherSessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return
    setLoading(true)
    Promise.all([teacherApi.availability.get(teacherId), teacherApi.sessions.list(teacherId)])
      .then(([avail, sess]) => {
        setRows(toRows(avail.availability))
        setSessions(sess.items)
      })
      .catch(() => setError('Could not load your schedule.'))
      .finally(() => setLoading(false))
  }, [teacherId])

  async function handleSave() {
    if (!teacherId || !rows) return
    setSaving(true)
    setError(null)
    try {
      const availability: Record<string, string[]> = {}
      for (const day of WEEKDAYS) {
        availability[day] = rows[day]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      await teacherApi.availability.update({ userId: teacherId, availability })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to save availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !rows) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>My Schedule</h1>
            <p className="dashboard-hero__sub">Loading your schedule…</p>
          </div>
        </div>
      </div>
    )
  }

  const upcoming = sessions.filter((s) => s.status === 'confirmed' || s.status === 'pending')
  const past = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Schedule</h1>
          <p className="dashboard-hero__sub">Set your weekly availability and see your booked sessions.</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="section-card__header" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="section-card__title">Weekly Availability</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {saved && <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>✓ Saved</span>}
            <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving} type="button">
              {saving ? 'Saving…' : 'Save Availability'}
            </button>
          </div>
        </div>
        {WEEKDAYS.map((day) => (
          <div key={day} className="form-group" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: 12 }}>
            <label className="form-label" style={{ margin: 0 }}>{day}</label>
            <input
              className="form-input"
              placeholder="e.g. 10:00-12:00, 15:00-18:00"
              value={rows[day]}
              onChange={(e) => setRows((r) => (r ? { ...r, [day]: e.target.value } : r))}
            />
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
        <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
          <h2 className="section-card__title">Upcoming Sessions</h2>
        </div>
        <SessionsTable rows={upcoming} emptyText="No upcoming sessions." />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
          <h2 className="section-card__title">Past Sessions</h2>
        </div>
        <SessionsTable rows={past} emptyText="No past sessions yet." />
      </div>
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
