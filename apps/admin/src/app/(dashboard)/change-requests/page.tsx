'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { BookingChangeRequestStatus } from '@beam/schemas'
import { adminApi, type ChangeRequestRow } from '@/lib/api'
import { formatInr } from '@/lib/formatters'
import { CHANGE_REQUEST_BADGE, formatDateTime, formatSlotWindow } from '@/lib/schedule-format'

const FILTERS: { id: BookingChangeRequestStatus | 'all'; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Declined' },
  { id: 'withdrawn', label: 'Withdrawn' },
  { id: 'all', label: 'All' },
]

function fullName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(' ') || '—'
}

// Older bookings may have no slot attached — fall back to the booking's own time
function currentWhen(r: ChangeRequestRow) {
  return r.currentSlotDate ? formatSlotWindow(r.currentSlotDate, r.currentSlotStart, r.currentSlotEnd) : formatDateTime(r.scheduledAt)
}

/** Ops queue for teacher-initiated reschedule / cancellation requests. */
export default function ChangeRequestsPage() {
  const [filter, setFilter] = useState<BookingChangeRequestStatus | 'all'>('pending')
  const [items, setItems] = useState<ChangeRequestRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await adminApi.changeRequests.list(filter === 'all' ? undefined : filter)
      setItems(res.items)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load change requests.')
      setItems([])
    }
  }, [filter])

  useEffect(() => {
    setItems(null)
    load()
  }, [load])

  async function review(r: ChangeRequestRow, action: 'approve' | 'reject') {
    const child = r.childFirstName ?? 'the child'
    const confirmText =
      action === 'reject'
        ? `Decline this ${r.type} request? The booking stays as scheduled and the teacher is notified.`
        : r.type === 'cancel'
          ? `Approve cancellation?\n\n${r.activityTitle} for ${child} on ${formatDateTime(r.scheduledAt)} will be CANCELLED and the parent's payment (${formatInr(Number(r.totalAmount))}) refunded.`
          : `Approve reschedule?\n\n${r.activityTitle} for ${child}\nFrom: ${currentWhen(r)}\nTo:   ${formatSlotWindow(r.proposedSlotDate, r.proposedSlotStart, r.proposedSlotEnd)}\n\nThe parent will be notified.`
    if (!window.confirm(confirmText)) return

    setActingId(r.id)
    setError(null)
    try {
      const res = await adminApi.changeRequests.review(r.id, { action, adminNote: notes[r.id]?.trim() || undefined })
      setFlash(
        action === 'reject'
          ? 'Request declined.'
          : r.type === 'cancel'
            ? `Booking cancelled${res.refunded ? ' and refund issued' : ''}.`
            : 'Booking rescheduled.',
      )
      setTimeout(() => setFlash(null), 3000)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Change Requests</h1>
          <p className="dashboard-hero__sub">Teacher requests to reschedule or cancel booked sessions. Nothing changes until you approve.</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`tab-btn${filter === f.id ? ' tab-btn--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {flash && <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>✓ {flash}</div>}
      {error && <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {items === null ? (
          <p style={{ padding: 'var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">{filter === 'pending' ? 'No pending requests' : 'Nothing here'}</p>
            <p className="empty-state__sub">{filter === 'pending' ? 'You are all caught up.' : 'Try another filter.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Teacher</th>
                  <th>Booking</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const isPending = r.status === 'pending'
                  return (
                    <tr key={r.id} style={{ verticalAlign: 'top' }}>
                      <td style={{ fontSize: 12, color: 'var(--color-gray)', whiteSpace: 'nowrap' }}>{formatDateTime(r.createdAt)}</td>
                      <td style={{ fontSize: 13 }}>{fullName(r.teacherFirstName, r.teacherLastName)}</td>
                      <td style={{ fontSize: 13 }}>
                        <Link href={`/bookings/${r.bookingId}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {r.activityTitle ?? 'Booking'}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                          {fullName(r.childFirstName, r.childLastName)} · parent {fullName(r.parentFirstName, r.parentLastName)}
                          {r.parentPhone && ` · ${r.parentPhone}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                          <span className={`badge badge--${r.bookingStatus}`} style={{ textTransform: 'capitalize', marginTop: 4 }}>{r.bookingStatus}</span>{' '}
                          <span className="cell-mono">{formatInr(Number(r.totalAmount))}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, minWidth: 220 }}>
                        {r.type === 'cancel' ? (
                          <>
                            <strong style={{ color: 'var(--color-error)' }}>Cancel</strong>
                            <div>{currentWhen(r)}</div>
                            <div style={{ color: 'var(--color-gray)' }}>Parent refunded on approval</div>
                          </>
                        ) : (
                          <>
                            <strong>Reschedule</strong>
                            <div style={{ color: 'var(--color-gray)' }}>From {currentWhen(r)}</div>
                            <div>To {formatSlotWindow(r.proposedSlotDate, r.proposedSlotStart, r.proposedSlotEnd)}</div>
                            {isPending && r.proposedSlotAvailable === false && (
                              <div style={{ color: 'var(--color-error)' }}>Proposed time has since been booked</div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 240 }}>
                        {r.reason}
                        {r.adminNote && <div style={{ color: 'var(--color-gray)', marginTop: 4 }}>Note: {r.adminNote}</div>}
                      </td>
                      <td>
                        <span className={`badge ${CHANGE_REQUEST_BADGE[r.status].className}`}>{CHANGE_REQUEST_BADGE[r.status].label}</span>
                        {r.reviewedAt && <div style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 4 }}>{formatDateTime(r.reviewedAt)}</div>}
                      </td>
                      <td style={{ minWidth: 200 }}>
                        {isPending && (
                          <div style={{ display: 'grid', gap: 6 }}>
                            <input
                              className="form-input"
                              placeholder="Note to teacher (optional)"
                              value={notes[r.id] ?? ''}
                              onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                              aria-label="Note to teacher"
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className={r.type === 'cancel' ? 'btn btn--danger btn--sm' : 'btn btn--primary btn--sm'}
                                disabled={actingId === r.id}
                                onClick={() => review(r, 'approve')}
                              >
                                {r.type === 'cancel' ? 'Approve & cancel' : 'Approve'}
                              </button>
                              <button type="button" className="btn btn--secondary btn--sm" disabled={actingId === r.id} onClick={() => review(r, 'reject')}>
                                Decline
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
