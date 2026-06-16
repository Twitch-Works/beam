'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { ActivityForm, FormState, EMPTY_FORM, apiToForm } from '../ActivityForm'

export default function ActivityDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [form,    setForm]    = useState<FormState>(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [meta,    setMeta]    = useState<{ totalBookings?: number; avgRating?: number }>({})

  const [slots,       setSlots]       = useState<any[]>([])
  const [teachers,    setTeachers]    = useState<{ id: string; name: string }[]>([])
  const [showSlotForm, setShowSlotForm] = useState(false)
  const [slotForm,    setSlotForm]    = useState({ teacherId: '', date: '', startTime: '09:00', endTime: '10:00' })
  const [addingSlot,  setAddingSlot]  = useState(false)
  const [slotError,   setSlotError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    void (async () => {
      try {
        const [activityRes, slotsRes, teachersRes] = await Promise.all([
          adminApi.activities.get(id).catch(() => null),
          adminApi.activities.slots(id).catch(() => ({ items: [] })),
          adminApi.teachers.list().catch(() => ({ items: [] })),
        ])
        if (activityRes) {
          setForm(apiToForm(activityRes))
          setMeta({ totalBookings: activityRes.totalBookings, avgRating: activityRes.avgRating })
        }
        setSlots(slotsRes.items ?? [])
        setTeachers((teachersRes.items ?? []).map((t: any) => ({
          id:   t.id,
          name: `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.email,
        })))
      } catch {}
      setLoading(false)
    })()
  }, [id])

  async function handleSave(status: FormState['status']) {
    setSaving(true)
    try {
      await adminApi.activities.update(id, {
        title: form.title,
        description: form.description,
        ageGroup: form.ageGroup,
        pricePerSession: Number(form.pricePerSession),
        categoryId: form.categoryId || undefined,
        sessionType: form.sessionType,
        sessionDurationMins: Number(form.sessionDuration?.replace(/\D/g, '') || 60),
        minChildren: Number(form.minChildren),
        maxChildren: Number(form.maxChildren),
        imageUrl: form.imageUrl || undefined,
        tags: form.tags,
        materialsNeeded: form.materialsNeeded || undefined,
        preparationNotes: form.preparationNotes || undefined,
        status,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // API unreachable — silently ignore so user can still navigate away
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this activity? It will be hidden from parents.')) return
    setForm(f => ({ ...f, status: 'archived' }))
    await handleSave('archived')
  }

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!slotForm.teacherId || !slotForm.date) {
      setSlotError('Teacher and date are required.')
      return
    }
    setAddingSlot(true)
    setSlotError(null)
    try {
      await adminApi.slots.create({ activityId: id, ...slotForm })
      const fresh = await adminApi.activities.slots(id)
      setSlots(fresh.items ?? [])
      setSlotForm({ teacherId: '', date: '', startTime: '09:00', endTime: '10:00' })
      setShowSlotForm(false)
    } catch {
      setSlotError('Failed to add slot. Make sure the API is running.')
    } finally {
      setAddingSlot(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn--ghost btn--sm" onClick={() => router.back()} type="button" style={{ marginBottom: 8 }}>
            ← Back to Activities
          </button>
          <h1>{loading ? 'Loading…' : form.title || 'Edit Activity'}</h1>
          {(meta.totalBookings != null || meta.avgRating != null) && (
            <p className="dashboard-hero__sub">
              {meta.totalBookings != null && (
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meta.totalBookings} bookings</span>
              )}
              {meta.totalBookings != null && meta.avgRating != null && <span> · </span>}
              {meta.avgRating != null && (
                <span style={{ color: '#FCB857', fontWeight: 600 }}>★ {meta.avgRating}</span>
              )}
            </p>
          )}
        </div>
        <div className="page-header__actions">
          {form.status === 'published' && (
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }} onClick={handleArchive} type="button">
              Archive
            </button>
          )}
          <button className="btn btn--secondary" onClick={() => handleSave('draft')} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn btn--primary" onClick={() => handleSave(form.status)} disabled={saving} type="button">
            {form.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          ✓ Changes saved
        </div>
      )}

      <ActivityForm value={form} onChange={setForm} mode="edit" activityId={id} meta={meta} />

      {/* ── Available Slots ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="form-section__title" style={{ margin: 0 }}>Available Slots</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => { setShowSlotForm(v => !v); setSlotError(null) }}
          >
            {showSlotForm ? 'Cancel' : '+ Add Slot'}
          </button>
        </div>

        {showSlotForm && (
          <form
            onSubmit={handleAddSlot}
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 16, marginBottom: 16 }}
          >
            {slotError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                {slotError}
              </div>
            )}
            <div className="form-grid form-grid--3" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Teacher <span style={{ color: 'var(--color-coral)' }}>*</span></label>
                <select
                  className="form-input"
                  value={slotForm.teacherId}
                  onChange={e => setSlotForm(f => ({ ...f, teacherId: e.target.value }))}
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date <span style={{ color: 'var(--color-coral)' }}>*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={slotForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSlotForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start</label>
                  <input type="time" className="form-input" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End</label>
                  <input type="time" className="form-input" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn--primary btn--sm" disabled={addingSlot}>
              {addingSlot ? 'Adding…' : 'Add Slot'}
            </button>
          </form>
        )}

        {slots.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-gray-text)', padding: '8px 0 4px' }}>
            No slots scheduled yet. Add a slot to make this activity bookable.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Date', 'Time', 'Teacher', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-gray-text)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.date}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-gray-text)' }}>{s.startTime} – {s.endTime}</td>
                    <td style={{ padding: '10px 12px' }}>{[s.teacherFirstName, s.teacherLastName].filter(Boolean).join(' ') || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {s.lockedByBookingId ? (
                        <span className="badge badge--confirmed" style={{ fontSize: 11 }}>Booked</span>
                      ) : s.isAvailable ? (
                        <span className="badge badge--pending" style={{ fontSize: 11 }}>Available</span>
                      ) : (
                        <span className="badge badge--cancelled" style={{ fontSize: 11 }}>Unavailable</span>
                      )}
                    </td>
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
