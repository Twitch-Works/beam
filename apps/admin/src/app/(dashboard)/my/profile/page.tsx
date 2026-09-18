'use client'

import { useEffect, useState } from 'react'
import { teacherApi, type TeacherProfileRow } from '@/lib/api'
import { useTeacherId } from '@/lib/useTeacherId'

type FormState = {
  firstName: string
  lastName: string
  city: string
  phone: string
  bio: string
  specializations: string
}

function toForm(p: TeacherProfileRow): FormState {
  return {
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    city: p.city ?? '',
    phone: p.phone ?? '',
    bio: p.bio ?? '',
    specializations: (p.specializations ?? []).join(', '),
  }
}

export default function MyProfilePage() {
  const teacherId = useTeacherId()
  const [profile, setProfile] = useState<TeacherProfileRow | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return
    setLoading(true)
    teacherApi.profile
      .get(teacherId)
      .then((p) => {
        setProfile(p)
        setForm(toForm(p))
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false))
  }, [teacherId])

  function set<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [key]: e.target.value } : f))
  }

  async function handleSave() {
    if (!teacherId || !form) return
    setSaving(true)
    setError(null)
    try {
      await teacherApi.profile.update({
        userId: teacherId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        specializations: form.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form || !profile) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p className="dashboard-hero__sub">Loading your profile…</p>
          </div>
        </div>
      </div>
    )
  }

  const statusClass =
    profile.verificationStatus === 'verified'
      ? 'badge--verified'
      : profile.verificationStatus === 'pending'
      ? 'badge--pending'
      : 'badge--suspended'

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p className="dashboard-hero__sub">Manage your details and what you teach on Beam.</p>
        </div>
        <div className="page-header__actions">
          {saved && <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, alignSelf: 'center' }}>✓ Saved</span>}
          <button className="btn btn--primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-3)', alignItems: 'start' }}>
        <div className="card">
          <h2 className="section-card__title" style={{ marginBottom: 'var(--space-4)' }}>Profile Details</h2>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={set('city')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-input" rows={4} value={form.bio} onChange={set('bio')} />
          </div>

          <div className="form-group">
            <label className="form-label">Subjects / Specializations (comma separated)</label>
            <input className="form-input" placeholder="e.g. Art, Storytelling, Sensory Play" value={form.specializations} onChange={set('specializations')} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="card">
            <h2 className="section-card__title" style={{ marginBottom: 'var(--space-3)' }}>Status</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Verification</span>
              <span className={`badge ${statusClass}`} style={{ textTransform: 'capitalize' }}>{profile.verificationStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Rating</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>★ {Number(profile.rating).toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Reviews</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{profile.reviewCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Completed Sessions</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{profile.totalSessions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
