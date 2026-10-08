'use client'

import { Fragment, useState } from 'react'
import type { BookingChangeRequestType } from '@beam/schemas'
import { teacherApi, type ChangeRequestRow, type TeacherSessionRow, type TeacherSlotRow } from '@/lib/api'
import { formatInr } from '@/lib/formatters'
import { CHANGE_REQUEST_BADGE, formatDateTime, formatSlotWindow } from '@/lib/schedule-format'

type Draft = { bookingId: string; type: BookingChangeRequestType; proposedSlotId: string; reason: string }

/**
 * Upcoming bookings with teacher-initiated reschedule/cancel requests.
 * Requests never change the booking directly — Beam ops approves them.
 */
export function UpcomingBookingsPanel({
  teacherId,
  sessions,
  slots,
  requests,
  onChanged,
}: {
  teacherId: string
  sessions: TeacherSessionRow[]
  slots: TeacherSlotRow[]
  requests: ChangeRequestRow[]
  onChanged: () => Promise<void>
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = Date.now()
  const upcoming = sessions
    .filter((s) => (s.status === 'pending' || s.status === 'confirmed') && s.scheduledAt && new Date(s.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const pendingByBooking = new Map(requests.filter((r) => r.status === 'pending').map((r) => [r.bookingId, r]))
  const history = requests.filter((r) => r.status !== 'pending')

  function openSlotsFor(activityId: string) {
    return slots.filter((s) => s.activityId === activityId && !s.bookingId && s.isAvailable && new Date(`${s.date}T${s.startTime}`).getTime() > now)
  }

  function startDraft(session: TeacherSessionRow, type: BookingChangeRequestType) {
    setError(null)
    setDraft({ bookingId: session.id, type, proposedSlotId: type === 'reschedule' ? (openSlotsFor(session.activityId)[0]?.id ?? '') : '', reason: '' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      await teacherApi.changeRequests.create(
        teacherId,
        draft.bookingId,
        draft.type === 'reschedule'
          ? { type: 'reschedule', proposedSlotId: draft.proposedSlotId, reason: draft.reason }
          : { type: 'cancel', reason: draft.reason },
      )
      setDraft(null)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request.')
    } finally {
      setBusy(false)
    }
  }

  async function withdraw(request: ChangeRequestRow) {
    if (!window.confirm('Withdraw this request? The booking will stay as scheduled.')) return
    setBusy(true)
    setError(null)
    try {
      await teacherApi.changeRequests.withdraw(teacherId, request.id)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
        <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
          <div>
            <h2 className="section-card__title">Upcoming Bookings</h2>
            <p style={{ fontSize: 12, color: 'var(--color-gray)', marginTop: 4 }}>
              Need to move or drop a class? Send a request — Beam ops reviews it and informs the parent.
            </p>
          </div>
        </div>

        {error && <p style={{ padding: '0 var(--space-4)', color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}

        {upcoming.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No upcoming bookings</p>
            <p className="empty-state__sub">New bookings will appear here once parents book your class times.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Activity</th>
                  <th>Child</th>
                  <th>Parent</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {upcoming.map((s) => {
                  const pending = pendingByBooking.get(s.id)
                  const isDrafting = draft?.bookingId === s.id
                  const openSlots = openSlotsFor(s.activityId)
                  return (
                    <Fragment key={s.id}>
                      <tr>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{formatDateTime(s.scheduledAt)}</td>
                        <td style={{ fontSize: 13 }}>{s.activityTitle ?? '—'}</td>
                        <td style={{ fontSize: 13 }}>{[s.childFirstName, s.childLastName].filter(Boolean).join(' ') || '—'}</td>
                        <td style={{ fontSize: 13 }}>
                          {s.parentFirstName ?? '—'}
                          {s.parentCity && <span style={{ color: 'var(--color-gray)' }}> · {s.parentCity}</span>}
                        </td>
                        <td className="cell-mono">{s.totalAmount ? formatInr(Number(s.totalAmount)) : '—'}</td>
                        <td>
                          <span className={`badge badge--${s.status}`} style={{ textTransform: 'capitalize' }}>{s.status}</span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {pending ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span className="badge badge--pending">
                                {pending.type === 'cancel' ? 'Cancellation' : 'Reschedule'} requested
                              </span>
                              <button type="button" className="btn btn--ghost btn--sm" onClick={() => withdraw(pending)} disabled={busy}>
                                Withdraw
                              </button>
                            </span>
                          ) : isDrafting ? null : (
                            <span style={{ display: 'inline-flex', gap: 6 }}>
                              <button type="button" className="btn btn--secondary btn--sm" onClick={() => startDraft(s, 'reschedule')}>
                                Reschedule
                              </button>
                              <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => startDraft(s, 'cancel')}>
                                Cancel
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                      {isDrafting && draft && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--color-bg)' }}>
                            <form onSubmit={submit} style={{ display: 'grid', gap: 12, padding: 'var(--space-2) 0' }}>
                              <strong style={{ fontSize: 13 }}>
                                {draft.type === 'reschedule' ? 'Request a reschedule' : 'Request a cancellation'} — {s.activityTitle} on {formatDateTime(s.scheduledAt)}
                              </strong>

                              {draft.type === 'reschedule' && (
                                openSlots.length === 0 ? (
                                  <p style={{ fontSize: 13, color: 'var(--color-warning-text)' }}>
                                    You have no open class times for this activity. Add one in the My Classes tab, then come back.
                                  </p>
                                ) : (
                                  <div className="form-group" style={{ margin: 0, maxWidth: 420 }}>
                                    <label className="form-label" htmlFor="proposed-slot">Move to</label>
                                    <select
                                      id="proposed-slot"
                                      className="form-input"
                                      value={draft.proposedSlotId}
                                      onChange={(e) => setDraft({ ...draft, proposedSlotId: e.target.value })}
                                      required
                                    >
                                      {openSlots.map((o) => (
                                        <option key={o.id} value={o.id}>{formatSlotWindow(o.date, o.startTime, o.endTime)}</option>
                                      ))}
                                    </select>
                                  </div>
                                )
                              )}

                              {draft.type === 'cancel' && (
                                <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>
                                  If approved, the booking is cancelled and the parent is refunded in full.
                                </p>
                              )}

                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" htmlFor="change-reason">Reason (shared with Beam ops)</label>
                                <textarea
                                  id="change-reason"
                                  className="form-input"
                                  rows={2}
                                  minLength={5}
                                  maxLength={500}
                                  value={draft.reason}
                                  onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                                  placeholder="e.g. Unwell that day / travelling out of city"
                                  required
                                />
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="submit"
                                  className={draft.type === 'cancel' ? 'btn btn--danger btn--sm' : 'btn btn--primary btn--sm'}
                                  disabled={busy || (draft.type === 'reschedule' && !draft.proposedSlotId)}
                                >
                                  {busy ? 'Sending…' : 'Send request to admin'}
                                </button>
                                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft(null)} disabled={busy}>
                                  Never mind
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
            <h2 className="section-card__title">Request History</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Type</th>
                  <th>Activity</th>
                  <th>Change</th>
                  <th>Outcome</th>
                  <th>Admin note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{formatDateTime(r.createdAt)}</td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{r.type}</td>
                    <td style={{ fontSize: 13 }}>{r.activityTitle ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.type === 'reschedule'
                        ? `→ ${formatSlotWindow(r.proposedSlotDate, r.proposedSlotStart, r.proposedSlotEnd)}`
                        : 'Cancel booking'}
                    </td>
                    <td><span className={`badge ${CHANGE_REQUEST_BADGE[r.status].className}`}>{CHANGE_REQUEST_BADGE[r.status].label}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{r.adminNote ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
