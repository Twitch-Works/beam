'use client'

import { useState } from 'react'
import type { Weekday, WeeklyAvailability } from '@beam/schemas'
import { teacherApi } from '@/lib/api'

// Type-only import keeps zod out of the client bundle
const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
type Range = { start: string; end: string }
type Rows = Record<Weekday, Range[]>

function toRows(availability: WeeklyAvailability | null): Rows {
  const rows = {} as Rows
  for (const day of WEEKDAYS) {
    rows[day] = (availability?.[day] ?? []).map((r) => {
      const [start, end] = r.split('-')
      return { start, end }
    })
  }
  return rows
}

function validate(rows: Rows): string | null {
  for (const day of WEEKDAYS) {
    const ranges = [...rows[day]].sort((a, b) => a.start.localeCompare(b.start))
    for (const [i, r] of ranges.entries()) {
      if (!r.start || !r.end) return `${day}: fill in both start and end times`
      if (r.start >= r.end) return `${day}: end time must be after start time`
      if (i > 0 && r.start < ranges[i - 1].end) return `${day}: time ranges overlap`
    }
  }
  return null
}

/**
 * Weekly working-hours preference. This is guidance for ops/scheduling — parents
 * book against concrete class times (see "My Classes"), not these ranges.
 */
export function AvailabilityPanel({ teacherId, initial }: { teacherId: string; initial: WeeklyAvailability | null }) {
  const [rows, setRows] = useState<Rows>(() => toRows(initial))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(day: Weekday, next: Range[]) {
    setRows((r) => ({ ...r, [day]: next }))
    setSaved(false)
  }

  async function handleSave() {
    const problem = validate(rows)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const availability = {} as WeeklyAvailability
      for (const day of WEEKDAYS) {
        availability[day] = [...rows[day]]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((r) => `${r.start}-${r.end}`)
      }
      await teacherApi.availability.update({ userId: teacherId, availability })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save availability.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="section-card__header">
        <div>
          <h2 className="section-card__title">Weekly Availability</h2>
          <p style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 4 }}>
            Your usual working hours. Add concrete bookable class times in the My Classes tab.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>✓ Saved</span>}
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save Availability'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 'var(--space-3)' }}>{error}</p>}

      {WEEKDAYS.map((day) => (
        <div
          key={day}
          style={{ display: 'grid', gridTemplateColumns: '64px 1fr', alignItems: 'start', gap: 12, padding: '10px 0', borderTop: '1px solid var(--color-border)' }}
        >
          <span className="form-label" style={{ margin: 0, paddingTop: 8 }}>{day}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {rows[day].length === 0 && <span style={{ fontSize: 13, color: 'var(--color-gray)', paddingTop: 2 }}>Unavailable</span>}
            {rows[day].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120 }}
                  value={r.start}
                  onChange={(e) => update(day, rows[day].map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                  aria-label={`${day} range ${i + 1} start`}
                />
                <span style={{ color: 'var(--color-gray)' }}>–</span>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120 }}
                  value={r.end}
                  onChange={(e) => update(day, rows[day].map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                  aria-label={`${day} range ${i + 1} end`}
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => update(day, rows[day].filter((_, j) => j !== i))}
                  aria-label={`Remove ${day} range ${i + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
            {rows[day].length < 6 && (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => update(day, [...rows[day], { start: '10:00', end: '12:00' }])}
              >
                + Add hours
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
