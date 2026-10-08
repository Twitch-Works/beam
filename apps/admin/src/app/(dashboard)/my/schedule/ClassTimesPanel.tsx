'use client'

import { useMemo, useState } from 'react'
import { teacherApi, type TeacherActivityRow, type TeacherSlotRow } from '@/lib/api'
import { addMinutes, dateInputValue, formatClock, formatDay } from '@/lib/schedule-format'

/**
 * The teacher's concrete, bookable class times for the next 30 days.
 * Adding/removing unbooked times applies immediately (no admin approval);
 * booked times can only change through a change request.
 */
export function ClassTimesPanel({
  teacherId,
  activities,
  slots,
  onChanged,
}: {
  teacherId: string
  activities: TeacherActivityRow[]
  slots: TeacherSlotRow[]
  onChanged: () => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [activityId, setActivityId] = useState(activities[0]?.id ?? '')
  const [date, setDate] = useState(dateInputValue(1))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState(() => addMinutes('10:00', activities[0]?.sessionDurationMins ?? 60))
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onlyOpen, setOnlyOpen] = useState(false)

  const selectedActivity = activities.find((a) => a.id === activityId)

  const byDay = useMemo(() => {
    const groups = new Map<string, TeacherSlotRow[]>()
    for (const s of slots) {
      if (onlyOpen && s.bookingId) continue
      groups.set(s.date, [...(groups.get(s.date) ?? []), s])
    }
    return [...groups.entries()]
  }, [slots, onlyOpen])

  const bookedCount = slots.filter((s) => s.bookingId).length

  function pickActivity(id: string) {
    setActivityId(id)
    const a = activities.find((x) => x.id === id)
    if (a) setEndTime(addMinutes(startTime, a.sessionDurationMins))
  }

  function pickStart(value: string) {
    setStartTime(value)
    if (selectedActivity) setEndTime(addMinutes(value, selectedActivity.sessionDurationMins))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await teacherApi.slots.create(teacherId, { activityId, date, startTime, endTime })
      await onChanged()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add class time.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(slot: TeacherSlotRow) {
    if (!window.confirm(`Remove ${slot.activityTitle ?? 'this class'} on ${formatDay(slot.date)} at ${formatClock(slot.startTime)}? Parents will no longer be able to book it.`)) return
    setRemovingId(slot.id)
    setError(null)
    try {
      await teacherApi.slots.remove(teacherId, slot.id)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove class time.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
        <div>
          <h2 className="section-card__title">My Classes — next 30 days</h2>
          <p style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 4 }}>
            {slots.length} class times · {bookedCount} booked · {slots.length - bookedCount} open for parents
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-gray)' }}>
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
            Open only
          </label>
          <button className="btn btn--primary btn--sm" type="button" onClick={() => setShowForm((v) => !v)} disabled={activities.length === 0}>
            {showForm ? 'Close' : '+ Add class time'}
          </button>
        </div>
      </div>

      {activities.length === 0 && (
        <p style={{ padding: '0 var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>
          No published activities match your specializations yet. Update them on My Profile or contact Beam ops.
        </p>
      )}

      {error && <p style={{ padding: '0 var(--space-4)', color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}

      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{ margin: 'var(--space-3) var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-card)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="slot-activity">Activity</label>
            <select id="slot-activity" className="form-input" value={activityId} onChange={(e) => pickActivity(e.target.value)} required>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.title} ({a.sessionDurationMins} min)</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="slot-date">Date</label>
            <input id="slot-date" type="date" className="form-input" min={dateInputValue(0)} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="slot-start">Start</label>
            <input id="slot-start" type="time" className="form-input" step={900} value={startTime} onChange={(e) => pickStart(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="slot-end">End</label>
            <input id="slot-end" type="time" className="form-input" step={900} value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
          <button className="btn btn--primary" type="submit" disabled={submitting || !activityId}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      {byDay.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">{onlyOpen ? 'No open class times' : 'No class times in the next 30 days'}</p>
          <p className="empty-state__sub">Add class times so parents can book you.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Activity</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {byDay.flatMap(([day, daySlots]) =>
                daySlots.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--color-navy)' : 'transparent' }}>{formatDay(day)}</td>
                    <td className="cell-mono">{formatClock(s.startTime)} – {formatClock(s.endTime)}</td>
                    <td style={{ fontSize: 13 }}>{s.activityTitle ?? '—'}</td>
                    <td>
                      {s.bookingId ? (
                        <span className="badge badge--confirmed">
                          Booked{s.childFirstName ? ` · ${s.childFirstName}` : ''}
                        </span>
                      ) : s.isAvailable ? (
                        <span className="badge badge--upcoming">Open</span>
                      ) : (
                        <span className="badge badge--pending">Held</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!s.bookingId && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => handleRemove(s)}
                          disabled={removingId === s.id}
                        >
                          {removingId === s.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
