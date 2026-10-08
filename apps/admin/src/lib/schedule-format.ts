import type { BookingChangeRequestStatus } from '@beam/schemas'

/** "10:00:00" → "10:00 am" */
export function formatClock(time: string | null | undefined): string {
  if (!time) return '—'
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

/** "2026-10-14" → "Wed, 14 Oct" */
export function formatDay(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatSlotWindow(date: string | null, start: string | null, end: string | null): string {
  if (!date || !start) return '—'
  return `${formatDay(date)} · ${formatClock(start)}${end ? ` – ${formatClock(end)}` : ''}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/** Local YYYY-MM-DD, offset by `days` from today */
export function dateInputValue(days = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const CHANGE_REQUEST_BADGE: Record<BookingChangeRequestStatus, { className: string; label: string }> = {
  pending:   { className: 'badge--pending',   label: 'Awaiting admin' },
  approved:  { className: 'badge--confirmed', label: 'Approved' },
  rejected:  { className: 'badge--cancelled', label: 'Declined' },
  withdrawn: { className: 'badge--upcoming',  label: 'Withdrawn' },
}
