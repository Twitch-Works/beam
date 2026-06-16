'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'

export type FormState = {
  title: string
  categoryId: string
  description: string
  ageGroup: string
  minChildren: string
  maxChildren: string
  sessionDuration: string
  pricePerSession: string
  sessionType: '1:1' | 'group'
  imageUrl: string
  tags: string
  materialsNeeded: string
  preparationNotes: string
  status: 'draft' | 'published' | 'archived'
}

export const EMPTY_FORM: FormState = {
  title: '', categoryId: '', description: '', ageGroup: '',
  minChildren: '1', maxChildren: '1', sessionDuration: '60 minutes',
  pricePerSession: '', sessionType: '1:1', imageUrl: '', tags: '',
  materialsNeeded: '', preparationNotes: '', status: 'draft',
}

export const AGE_GROUPS = ['2-3 years', '3-5 years', '5-8 years', '8-12 years']
export const DURATIONS  = ['30 minutes', '45 minutes', '60 minutes', '90 minutes', '120 minutes']

type CategoryOption = {
  id: string
  name: string
}

export function apiToForm(a: any): FormState {
  return {
    title:             a.title ?? '',
    categoryId:        a.categoryId ?? '',
    description:       a.description ?? '',
    ageGroup:          a.ageGroup ?? '',
    minChildren:       String(a.minChildren ?? 1),
    maxChildren:       String(a.maxChildren ?? 1),
    sessionDuration:   a.sessionDurationMins ? `${a.sessionDurationMins} minutes` : '60 minutes',
    pricePerSession:   String(a.pricePerSession ?? ''),
    sessionType:       a.sessionType === 'one_on_one' ? '1:1' : 'group',
    imageUrl:          a.imageUrl ?? '',
    tags:              Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags ?? ''),
    materialsNeeded:   a.materialsNeeded ?? '',
    preparationNotes:  a.preparationNotes ?? '',
    status:            (a.status ?? 'draft') as FormState['status'],
  }
}

const SESSION_TYPES = [
  { value: '1:1'   as const, label: '1:1 Individual', desc: 'Dedicated teacher–child time' },
  { value: 'group' as const, label: 'Group Session',  desc: 'Multiple children together'  },
]

const STATUS_OPTIONS = [
  { value: 'draft'     as const, label: 'Draft',     color: '#92400E', bg: '#FEF3C7' },
  { value: 'published' as const, label: 'Published', color: '#166534', bg: '#DCFCE7' },
]

function StatusToggle({ value, onChange }: { value: FormState['status']; onChange: (s: 'draft' | 'published') => void }) {
  return (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
      {STATUS_OPTIONS.map(s => {
        const active = value === s.value
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            style={{
              padding: '5px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: active ? s.bg : 'transparent',
              color: active ? s.color : 'var(--color-gray-text)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

interface ActivityFormProps {
  value:        FormState
  onChange:     (v: FormState) => void
  mode?:        'create' | 'edit'
  activityId?:  string
  meta?:        { totalBookings?: number; avgRating?: number }
}

export function ActivityForm({ value, onChange, mode = 'create', activityId, meta }: ActivityFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([])

  useEffect(() => {
    let isMounted = true
    void (async () => {
      try {
        const response = await adminApi.categories.list()
        if (!isMounted) return
        setCategories(
          (response.items ?? []).map((category: any) => ({
            id: category.id,
            name: category.name,
          })),
        )
      } catch {
        if (!isMounted) return
        setCategories([])
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...value, [field]: e.target.value })
  }

  const parsedTags = value.tags
    ? value.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  const mainForm = (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* ── Basic Info ── */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)' }}>
        <p className="form-section__title">Basic Information</p>

        <div className="form-group">
          <label className="form-label">Activity Title <span style={{ color: 'var(--color-coral)' }}>*</span></label>
          <input className="form-input" placeholder="e.g. Messy Play Adventure" value={value.title} onChange={set('title')} />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Category <span style={{ color: 'var(--color-coral)' }}>*</span></label>
            <select className="form-input" value={value.categoryId} onChange={set('categoryId')}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Age Group <span style={{ color: 'var(--color-coral)' }}>*</span></label>
            <select className="form-input" value={value.ageGroup} onChange={set('ageGroup')}>
              <option value="">Select age group</option>
              {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description <span style={{ color: 'var(--color-coral)' }}>*</span></label>
          <textarea
            className="form-input"
            style={{ height: 96, resize: 'vertical' }}
            placeholder="Describe what children will do and learn in this activity…"
            value={value.description}
            onChange={set('description')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cover Image URL</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="form-input"
              placeholder="https://images.unsplash.com/…"
              value={value.imageUrl}
              onChange={set('imageUrl')}
            />
            {value.imageUrl && (
              <img
                src={value.imageUrl}
                alt=""
                style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tags <span style={{ fontWeight: 400, color: 'var(--color-gray-text)' }}>(comma-separated)</span></label>
          <input className="form-input" placeholder="e.g. sensory, creative, motor skills" value={value.tags} onChange={set('tags')} />
          {parsedTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {parsedTags.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--color-mint)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pricing & Session ── */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)' }}>
        <p className="form-section__title">Pricing & Session</p>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Duration <span style={{ color: 'var(--color-coral)' }}>*</span></label>
            <select className="form-input" value={value.sessionDuration} onChange={set('sessionDuration')}>
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price Per Session (₹) <span style={{ color: 'var(--color-coral)' }}>*</span></label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 649" value={value.pricePerSession} onChange={set('pricePerSession')} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: value.sessionType === 'group' ? 16 : 0 }}>
          <label className="form-label">Session Type <span style={{ color: 'var(--color-coral)' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            {SESSION_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ ...value, sessionType: t.value })}
                style={{
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: `2px solid ${value.sessionType === t.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: value.sessionType === t.value ? 'var(--color-mint)' : '#fff',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: value.sessionType === t.value ? 'var(--color-primary)' : 'var(--color-navy)' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-text)', marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {value.sessionType === 'group' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Min Children</label>
              <input className="form-input" type="number" min="2" value={value.minChildren} onChange={set('minChildren')} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Children</label>
              <input className="form-input" type="number" min="2" value={value.maxChildren} onChange={set('maxChildren')} />
            </div>
          </div>
        )}
      </div>

      {/* ── Materials & Prep ── */}
      <div style={{ padding: '24px 28px', borderBottom: mode === 'create' ? '1px solid var(--color-border)' : undefined }}>
        <p className="form-section__title">Materials & Preparation</p>
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Materials Needed</label>
            <textarea className="form-input" style={{ height: 80, resize: 'vertical' }} placeholder="List any materials the teacher or parent needs…" value={value.materialsNeeded} onChange={set('materialsNeeded')} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Preparation Notes</label>
            <textarea className="form-input" style={{ height: 80, resize: 'vertical' }} placeholder="Setup notes for teachers…" value={value.preparationNotes} onChange={set('preparationNotes')} />
          </div>
        </div>
      </div>

      {/* ── Visibility (create only — shown in sidebar on edit) ── */}
      {mode === 'create' && (
        <div style={{ padding: '24px 28px' }}>
          <p className="form-section__title">Visibility</p>
          <StatusToggle value={value.status} onChange={s => onChange({ ...value, status: s })} />
        </div>
      )}
    </div>
  )

  const sidebar = mode === 'edit' ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Visibility */}
      <div className="card" style={{ padding: 20 }}>
        <p className="form-section__title" style={{ marginBottom: 12 }}>Visibility</p>
        <StatusToggle value={value.status} onChange={s => onChange({ ...value, status: s })} />
      </div>

      {/* Stats */}
      {(meta?.totalBookings != null || meta?.avgRating != null) && (
        <div className="card" style={{ padding: 20 }}>
          <p className="form-section__title" style={{ marginBottom: 14 }}>Performance</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {meta?.totalBookings != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>Total Bookings</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{meta.totalBookings}</span>
              </div>
            )}
            {meta?.avgRating != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>Avg Rating</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#FCB857', fontFamily: 'var(--font-mono)' }}>★ {meta.avgRating}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity ID */}
      {activityId && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--color-gray-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Activity ID</p>
          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-navy)', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>{activityId}</p>
        </div>
      )}
    </div>
  ) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mode === 'edit' ? '1fr 240px' : '1fr', gap: 20, alignItems: 'start' }}>
      {mainForm}
      {sidebar}
    </div>
  )
}
