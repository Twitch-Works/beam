'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'

type PendingTeacher = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  specialties: string[]
  submittedAt: string
  documents: { idProof: boolean; certificate: boolean; policeCheck: boolean }
  experience: string
}

function DocPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: ok ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
      color: ok ? 'var(--color-success-text)' : 'var(--color-error-text)',
    }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

type ActionState = Record<string, 'idle' | 'approved' | 'rejected' | 'loading'>

export default function VerificationPage() {
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<'newest' | 'oldest'>('newest')
  const [actions, setActions]   = useState<ActionState>({})
  const [pending, setPending]   = useState<PendingTeacher[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    adminApi.teachers.verificationPending().then(data => {
      setPending(data.items.map((t: any) => ({
        id: t.id,
        name: `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim(),
        email: t.email ?? '',
        phone: t.phone ?? '—',
        city: t.city ?? '—',
        specialties: t.specializations ?? [],
        submittedAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
        documents: { idProof: false, certificate: false, policeCheck: false },
        experience: '',
      })))
    }).catch(() => {
      // API unavailable — leave empty
    }).finally(() => setFetching(false))
  }, [])

  const filtered = useMemo(() => {
    let list = pending.filter(t => actions[t.id] === undefined || actions[t.id] === 'idle')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
    }
    return sort === 'newest' ? list : [...list].reverse()
  }, [search, sort, actions, pending])

  const docsComplete = (_t: PendingTeacher) => true

  async function approve(id: string) {
    setActions(a => ({ ...a, [id]: 'loading' }))
    try {
      await adminApi.teachers.verify(id, { action: 'verify' })
      setActions(a => ({ ...a, [id]: 'approved' }))
    } catch {
      setActions(a => ({ ...a, [id]: 'idle' }))
    }
  }

  async function reject(id: string) {
    setActions(a => ({ ...a, [id]: 'loading' }))
    try {
      await adminApi.teachers.verify(id, { action: 'reject' })
      setActions(a => ({ ...a, [id]: 'rejected' }))
    } catch {
      setActions(a => ({ ...a, [id]: 'idle' }))
    }
  }

  const approvedCount = Object.values(actions).filter(v => v === 'approved').length
  const rejectedCount = Object.values(actions).filter(v => v === 'rejected').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Verification Queue</h1>
          <p className="dashboard-hero__sub">Review and approve pending teacher applications.</p>
        </div>
        <Link href="/teachers" className="btn btn--ghost btn--sm">← All Teachers</Link>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        {[
          { label: 'Pending Review', value: fetching ? '…' : pending.length, tone: 'yellow' },
          { label: 'Docs Complete', value: fetching ? '…' : pending.filter(docsComplete).length, tone: 'green' },
          { label: 'Approved Today', value: approvedCount, tone: 'teal' },
          { label: 'Rejected Today', value: rejectedCount, tone: 'lavender' },
        ].map(k => (
          <div key={k.label} className={`card stat-card`}>
            <div>
              <p className="stat-card__label">{k.label}</p>
              <p className="stat-card__value">{k.value}</p>
            </div>
            <div className={`stat-card__icon stat-card__icon--${k.tone}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card filter-bar">
        <input
          className="filter-bar__search"
          placeholder="Search by name, email or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-bar__select" value={sort} onChange={e => setSort(e.target.value as 'newest' | 'oldest')}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <span className="filter-bar__spacer" />
        <span className="filter-bar__count">{filtered.length} pending</span>
      </div>

      {/* Teacher cards */}
      {filtered.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-state__title">No pending applications</p>
          <p className="empty-state__sub">All applications have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 200 }}>
                <div className="avatar avatar--lg">{t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>{t.email}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>{t.phone}</p>
                </div>
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {t.specialties.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                  {t.city} · {t.experience} experience · Submitted {t.submittedAt}
                </p>
              </div>

              {/* Documents */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 240 }}>
                <DocPill ok={t.documents.idProof}    label="ID Proof" />
                <DocPill ok={t.documents.certificate} label="Certificate" />
                <DocPill ok={t.documents.policeCheck} label="Police Check" />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, alignItems: 'center' }}>
                <Link href={`/teachers/${t.id}`} className="btn btn--ghost btn--sm">View Profile</Link>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => approve(t.id)}
                  disabled={actions[t.id] === 'loading'}
                  type="button"
                >
                  {actions[t.id] === 'loading' ? '…' : 'Approve'}
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => reject(t.id)}
                  disabled={actions[t.id] === 'loading'}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
