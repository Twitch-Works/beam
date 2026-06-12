'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { ActivityForm, FormState, EMPTY_FORM } from '../ActivityForm'

export default function NewActivityPage() {
  const router = useRouter()
  const [form, setForm]   = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSubmit(status: 'draft' | 'published') {
    setSaving(true)
    setError(null)
    try {
      const result = await adminApi.activities.create({
        ...form,
        status,
        sessionType: form.sessionType === '1:1' ? 'one_on_one' : 'group',
        sessionDurationMins: parseInt(form.sessionDuration) || 60,
      })
      setSaved(true)
      setTimeout(() => router.push(`/activities/${result.id}`), 800)
    } catch {
      setError('Failed to save activity. Check all required fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>New Activity</h1>
          <p className="dashboard-hero__sub">Add a new activity to the Beam curriculum.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--ghost btn--sm" onClick={() => router.back()} type="button">Cancel</button>
          <button className="btn btn--secondary" onClick={() => handleSubmit('draft')} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn btn--primary" onClick={() => handleSubmit('published')} disabled={saving} type="button">
            Publish
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          ✓ Activity saved — redirecting to edit page…
        </div>
      )}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <ActivityForm value={form} onChange={setForm} mode="create" />

      <div className="card" style={{ marginTop: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.7 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 2 }}>Available Slots</p>
          <p style={{ fontSize: 12, color: 'var(--color-gray-text)', margin: 0 }}>Save this activity first — you can schedule slots from the edit page.</p>
        </div>
      </div>
    </div>
  )
}
