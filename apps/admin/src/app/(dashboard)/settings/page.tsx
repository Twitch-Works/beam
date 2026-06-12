'use client'

import { useState } from 'react'

interface FeatureFlag {
  key: string
  label: string
  description: string
  enabled: boolean
}

const INITIAL_FLAGS: FeatureFlag[] = [
  { key: 'ai_recommendations', label: 'AI Recommendations', description: 'Show AI-powered activity suggestions to parents on the home screen.', enabled: true },
  { key: 'realtime_sos', label: 'Realtime SOS', description: 'Enable SOS alert flow for live sessions with admin interrupt treatment.', enabled: true },
  { key: 'teacher_instant_payout', label: 'Instant Payouts (Pilot)', description: 'Allow eligible teachers to request same-day payouts (Razorpay X).', enabled: false },
  { key: 'multi_child_discount', label: 'Multi-Child Discount', description: 'Automatically apply 10% discount when parent books for 2+ children.', enabled: true },
  { key: 'video_sessions', label: 'Online Sessions (Beta)', description: 'Enable video-call based at-home sessions in addition to in-person.', enabled: false },
  { key: 'parent_referral_v2', label: 'Referral Program v2', description: 'New ₹200 referral reward system replacing the legacy ₹100 flow.', enabled: false },
]

export default function SettingsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS)
  const [platformFee, setPlatformFee] = useState('20')
  const [supportEmail, setSupportEmail] = useState('support@beam.in')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggleFlag(key: string) {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('Settings API is not wired yet. Changes are local preview only and were not saved.')
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>System Settings</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-gray)', fontSize: 14 }}>
            Platform configuration — <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>super_admin only</span>
          </p>
        </div>
        <div className="page-header__actions">
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            Preview only
          </div>
        </div>
      </div>

      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
        Settings mutations are disabled until the admin settings API is available. These controls only preview UI state.
      </div>

      <form onSubmit={handleSave}>
        {/* Platform Config */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid var(--color-border)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Platform Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 6 }}>
                Platform Fee (%)
              </label>
              <input
                type="number" min="0" max="50" value={platformFee}
                onChange={e => {
                  setSaveError(null)
                  setPlatformFee(e.target.value)
                }}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-gray)' }}>Percentage deducted from each booking before teacher payout.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 6 }}>
                Support Email
              </label>
              <input
                type="email" value={supportEmail}
                onChange={e => {
                  setSaveError(null)
                  setSupportEmail(e.target.value)
                }}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 14 }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-gray)' }}>Shown to parents and teachers in all support comms.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 6 }}>
                Payout Schedule
              </label>
              <select style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 14 }}>
                <option>T+2 (default)</option>
                <option>T+3</option>
                <option>Weekly (every Friday)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-navy)', marginBottom: 6 }}>
                Cancellation Window (hours)
              </label>
              <input
                type="number" defaultValue={24}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 14, fontFamily: 'var(--font-mono)' }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-gray)' }}>Hours before session to allow penalty-free cancellation.</p>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid var(--color-border)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Feature Flags</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {flags.map((f, i) => (
              <div key={f.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0', borderBottom: i < flags.length - 1 ? '1px solid #F8FAFC' : 'none'
              }}>
                <div style={{ flex: 1, marginRight: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-gray)' }}>{f.description}</div>
                  <code style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{f.key}</code>
                </div>
                <div
                  onClick={() => toggleFlag(f.key)}
                  style={{
                    width: 48, height: 26, borderRadius: 99, cursor: 'pointer',
                    background: f.enabled ? 'var(--color-primary)' : '#CBD5E1',
                    position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: f.enabled ? 25 : 3,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Mode */}
        <div style={{
          background: maintenanceMode ? '#FEF2F2' : '#fff', borderRadius: 16, padding: 28,
          border: `1px solid ${maintenanceMode ? '#FECACA' : '#F1F5F9'}`,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: maintenanceMode ? '#DC2626' : 'var(--color-navy)' }}>
                Maintenance Mode
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-gray)' }}>
                When enabled, all parent and teacher apps show a maintenance notice. Admin access remains active.
              </p>
            </div>
            <div
              onClick={() => {
                if (!maintenanceMode && !confirm('Enable maintenance mode? This will block all parent and teacher access.')) return
                setSaveError(null)
                setMaintenanceMode(v => !v)
              }}
              style={{
                width: 48, height: 26, borderRadius: 99, cursor: 'pointer',
                background: maintenanceMode ? '#DC2626' : '#CBD5E1',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s', marginLeft: 24
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: maintenanceMode ? 25 : 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s'
              }} />
            </div>
          </div>
          {maintenanceMode && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
              ⚠️ Maintenance mode is active. Parents and teachers cannot access the platform.
            </div>
          )}
        </div>

        {/* Save */}
        {saveError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn--secondary btn--sm" style={{ padding: '10px 24px' }}>Reset to Defaults</button>
          <button type="submit" style={{
            background: '#94A3B8', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14
          }}>
            Save unavailable
          </button>
        </div>
      </form>
    </div>
  )
}
