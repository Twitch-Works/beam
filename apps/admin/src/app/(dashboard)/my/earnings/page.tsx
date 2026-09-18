'use client'

import { useEffect, useState } from 'react'
import { teacherApi, type ApiRecord } from '@/lib/api'
import { useTeacherId } from '@/lib/useTeacherId'
import { formatInr } from '@/lib/formatters'

type Earnings = {
  totalEarned: string
  totalSessions: number
  pendingPayout: string
  awaitingPayoutCount: number
  payouts: ApiRecord[]
}

export default function MyEarningsPage() {
  const teacherId = useTeacherId()
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return
    setLoading(true)
    teacherApi.earnings
      .get(teacherId)
      .then(setEarnings)
      .catch(() => setError('Could not load your earnings.'))
      .finally(() => setLoading(false))
  }, [teacherId])

  if (loading || !earnings) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>My Earnings</h1>
            <p className="dashboard-hero__sub">Loading your earnings…</p>
          </div>
        </div>
      </div>
    )
  }

  const tiles = [
    { label: 'Total Earned', value: formatInr(Number(earnings.totalEarned)), tone: 'teal' },
    { label: 'Completed Sessions', value: String(earnings.totalSessions), tone: 'navy' },
    { label: 'Pending Payout', value: formatInr(Number(earnings.pendingPayout)), tone: 'yellow' },
    { label: 'Awaiting Payout', value: String(earnings.awaitingPayoutCount), tone: 'navy' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Earnings</h1>
          <p className="dashboard-hero__sub">Your revenue and payout history.</p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <p style={{ fontSize: 12, color: 'var(--color-gray)', marginBottom: 8 }}>{t.label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--color-navy)' }}>{t.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="section-card__header" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
          <h2 className="section-card__title">Payout History</h2>
        </div>
        {earnings.payouts.length === 0 ? (
          <p style={{ padding: 'var(--space-4)', fontSize: 13, color: 'var(--color-gray)' }}>No payouts yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Sessions</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Settled</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-mono">{formatInr(Number(p.amount))}</td>
                    <td style={{ fontSize: 13 }}>{p.sessionCount ?? '—'}</td>
                    <td><span className={`badge badge--${p.status}`} style={{ textTransform: 'capitalize' }}>{p.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{p.settledAt ? new Date(p.settledAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
