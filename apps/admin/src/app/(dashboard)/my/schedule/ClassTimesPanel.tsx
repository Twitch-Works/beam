'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { teacherApi, type TeacherActivityRow, type TeacherSlotRow } from '@/lib/api'
import { formatInr } from '@/lib/formatters'
import { addMinutes, dateInputValue, formatClock, formatDay } from '@/lib/schedule-format'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_PILLS = 3

/** Local YYYY-MM-DD for a Date */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Monday-first grid of whole weeks covering the month */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const end = new Date(last)
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)))
  const days: Date[] = []
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d))
  return days
}

function slotState(s: TeacherSlotRow): 'booked' | 'open' | 'held' {
  if (s.bookingId) return 'booked'
  return s.isAvailable ? 'open' : 'held'
}

/**
 * The teacher's bookable class times as a month calendar (or list).
 * Adding/removing unbooked times applies immediately (no admin approval);
 * booked times can only change through a change request.
 */
export function ClassTimesPanel({
  teacherId,
  activities,
  onChanged,
  addSignal,
}: {
  teacherId: string
  activities: TeacherActivityRow[]
  onChanged: () => Promise<void>
  /** Bumped by the page header's "Add class time" button to open the form */
  addSignal: number
}) {
  const today = dateInputValue(0)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [monthSlots, setMonthSlots] = useState<TeacherSlotRow[] | null>(null)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDay, setSelectedDay] = useState(today)
  const [onlyOpen, setOnlyOpen] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [activityId, setActivityId] = useState(activities[0]?.id ?? '')
  const [date, setDate] = useState(dateInputValue(1))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState(() => addMinutes('10:00', activities[0]?.sessionDurationMins ?? 60))
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const selectedActivity = activities.find((a) => a.id === activityId)

  const loadMonth = useCallback(async () => {
    const from = ymd(startOfMonth(month))
    const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0))
    try {
      const res = await teacherApi.slots.list(teacherId, { from, to })
      setMonthSlots(res.items)
    } catch {
      setError('Could not load class times for this month.')
    }
  }, [teacherId, month])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  const openAdd = useCallback(
    (onDate?: string, forActivityId?: string) => {
      const nextActivity = activities.find((a) => a.id === forActivityId) ?? selectedActivity ?? activities[0]
      if (nextActivity) {
        setActivityId(nextActivity.id)
        setEndTime(addMinutes(startTime, nextActivity.sessionDurationMins))
      }
      setDate(onDate && onDate >= today ? onDate : dateInputValue(1))
      setError(null)
      setShowForm(true)
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    },
    [activities, selectedActivity, startTime, today],
  )

  // Header button on the page opens the form here; the ref keeps this effect
  // keyed to new clicks only, while still calling the latest openAdd.
  const openFromHeader = useRef(() => {})
  openFromHeader.current = () => {
    if (activities.length > 0) openAdd(selectedDay)
  }
  useEffect(() => {
    if (addSignal > 0) openFromHeader.current()
  }, [addSignal])

  const visibleSlots = useMemo(
    () => (monthSlots ?? []).filter((s) => !(onlyOpen && s.bookingId)),
    [monthSlots, onlyOpen],
  )

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, TeacherSlotRow[]>()
    for (const s of visibleSlots) groups.set(s.date, [...(groups.get(s.date) ?? []), s])
    return groups
  }, [visibleSlots])

  const bookedCount = (monthSlots ?? []).filter((s) => s.bookingId).length
  const totalCount = monthSlots?.length ?? 0

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  function goToday() {
    setMonth(startOfMonth(new Date()))
    setSelectedDay(today)
  }

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
      setShowForm(false)
      setSelectedDay(date)
      const added = new Date(`${date}T00:00:00`)
      if (added.getFullYear() !== month.getFullYear() || added.getMonth() !== month.getMonth()) {
        setMonth(startOfMonth(added)) // effect reloads the new month
      } else {
        await loadMonth()
      }
      await onChanged()
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
      await Promise.all([loadMonth(), onChanged()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove class time.')
    } finally {
      setRemovingId(null)
    }
  }

  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const selectedSlots = slotsByDay.get(selectedDay) ?? []

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {/* Activities this teacher can schedule */}
      <div className="card">
        <div className="section-card__header" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <h2 className="section-card__title">Activities you can teach</h2>
            <p style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 4 }}>
              Published Beam activities matching your specializations. Schedule a class time so parents can book it.
            </p>
          </div>
        </div>
        {activities.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>
            No published activities match your specializations yet. Update them on My Profile or contact Beam ops.
          </p>
        ) : (
          <div className="activity-chips">
            {activities.map((a) => {
              const scheduled = (monthSlots ?? []).filter((s) => s.activityId === a.id).length
              return (
                <div key={a.id} className="activity-chip">
                  <div style={{ minWidth: 0 }}>
                    <p className="activity-chip__title">{a.title}</p>
                    <p className="activity-chip__meta">
                      {[a.categoryName, `${a.sessionDurationMins} min`, formatInr(Number(a.pricePerSession))].filter(Boolean).join(' · ')}
                    </p>
                    <p className="activity-chip__meta">{scheduled} scheduled in {month.toLocaleDateString('en-IN', { month: 'short' })}</p>
                  </div>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => openAdd(selectedDay, a.id)}>
                    Schedule
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <h2 className="section-card__title" style={{ minWidth: 150, textAlign: 'center' }}>{monthLabel}</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={goToday}>Today</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>
              {totalCount} class times · {bookedCount} booked · {totalCount - bookedCount} open
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-gray)' }}>
              <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
              Open only
            </label>
            <fieldset className="view-switch">
              <legend className="sr-only">View</legend>
              <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
            </fieldset>
            <button className="btn btn--primary btn--sm" type="button" onClick={() => (showForm ? setShowForm(false) : openAdd(selectedDay))} disabled={activities.length === 0}>
              {showForm ? 'Close' : '+ Add class time'}
            </button>
          </div>
        </div>

        {error && <p style={{ padding: 'var(--space-3) var(--space-4) 0', color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}

        {showForm && (
          <form ref={formRef} onSubmit={handleAdd} className="class-form">
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
              <input id="slot-date" type="date" className="form-input" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
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

        {monthSlots === null ? (
          <p style={{ padding: 'var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>Loading class times…</p>
        ) : view === 'calendar' ? (
          <>
            <div className="class-cal">
              {WEEKDAYS.map((d) => (
                <div key={d} className="class-cal__weekday">{d}</div>
              ))}
              {monthGrid(month).map((d) => {
                const key = ymd(d)
                const daySlots = slotsByDay.get(key) ?? []
                const classes = [
                  'class-cal__day',
                  d.getMonth() !== month.getMonth() && 'class-cal__day--outside',
                  key < today && 'class-cal__day--past',
                  key === today && 'class-cal__day--today',
                  key === selectedDay && 'class-cal__day--selected',
                ].filter(Boolean).join(' ')
                return (
                  <button key={key} type="button" className={classes} onClick={() => setSelectedDay(key)} aria-label={`${formatDay(key)}: ${daySlots.length} class times`}>
                    <span className="class-cal__date">{d.getDate()}</span>
                    {daySlots.slice(0, MAX_PILLS).map((s) => (
                      <span key={s.id} className={`class-cal__pill class-cal__pill--${slotState(s)}`}>
                        {formatClock(s.startTime)} {s.activityTitle}
                      </span>
                    ))}
                    {daySlots.length > MAX_PILLS && <span className="class-cal__more">+{daySlots.length - MAX_PILLS} more</span>}
                  </button>
                )
              })}
            </div>

            <div className="class-cal__legend">
              <span><i className="class-cal__dot class-cal__pill--open" /> Open for parents</span>
              <span><i className="class-cal__dot class-cal__pill--booked" /> Booked</span>
              <span><i className="class-cal__dot class-cal__pill--held" /> Held during checkout</span>
            </div>

            {/* Selected day detail */}
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
                <h3 className="section-card__title">{formatDay(selectedDay)}</h3>
                {selectedDay >= today && activities.length > 0 && (
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => openAdd(selectedDay)}>
                    + Add class on this day
                  </button>
                )}
              </div>
              <SlotsTable
                slots={selectedSlots}
                removingId={removingId}
                onRemove={handleRemove}
                emptyText={selectedDay < today ? 'No classes on this day.' : 'No classes scheduled on this day yet.'}
              />
            </div>
          </>
        ) : (
          <SlotsTable
            slots={visibleSlots}
            removingId={removingId}
            onRemove={handleRemove}
            showDate
            emptyText={onlyOpen ? `No open class times in ${monthLabel}.` : `No class times in ${monthLabel}. Add one so parents can book you.`}
          />
        )}
      </div>
    </div>
  )
}

function SlotsTable({
  slots,
  removingId,
  onRemove,
  emptyText,
  showDate = false,
}: {
  slots: TeacherSlotRow[]
  removingId: string | null
  onRemove: (slot: TeacherSlotRow) => void
  emptyText: string
  showDate?: boolean
}) {
  if (slots.length === 0) {
    return <p style={{ padding: 'var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>{emptyText}</p>
  }
  const today = dateInputValue(0)
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {showDate && <th>Date</th>}
            <th>Time</th>
            <th>Activity</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {slots.map((s, i) => {
            const firstOfDay = i === 0 || slots[i - 1].date !== s.date
            const state = slotState(s)
            return (
              <tr key={s.id}>
                {showDate && (
                  <td style={{ fontSize: 13, fontWeight: firstOfDay ? 600 : 400, color: firstOfDay ? 'var(--color-navy)' : 'transparent' }}>{formatDay(s.date)}</td>
                )}
                <td className="cell-mono">{formatClock(s.startTime)} – {formatClock(s.endTime)}</td>
                <td style={{ fontSize: 13 }}>{s.activityTitle ?? '—'}</td>
                <td>
                  {state === 'booked' ? (
                    <span className="badge badge--confirmed">Booked{s.childFirstName ? ` · ${s.childFirstName}` : ''}</span>
                  ) : state === 'open' ? (
                    <span className="badge badge--upcoming">Open</span>
                  ) : (
                    <span className="badge badge--pending">Held</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {!s.bookingId && s.date >= today && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onRemove(s)} disabled={removingId === s.id}>
                      {removingId === s.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
