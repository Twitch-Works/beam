'use client'

import { useEffect, useState } from 'react'
import type { AdminSession } from '@/lib/admin-access'
import { ShieldAlert, User, Phone, MapPin, Clock, UserCheck } from 'lucide-react'

type SosAlert = {
  id: string
  childName: string
  childAge: number
  parentName: string
  parentPhone: string
  teacherName: string
  teacherPhone: string
  activityName: string
  address: string
  bookingId: string
  triggeredAt: string
}

type AlertState =
  | { status: 'idle'; alert: null }
  | { status: 'active'; alert: SosAlert }
  | { status: 'acknowledged'; alert: SosAlert; acknowledgedBy: string; acknowledgedAt: string }

const FALLBACK_ALERT: SosAlert = {
  id: 'SOS-PREVIEW',
  childName: 'Aarav Mehta',
  childAge: 5,
  parentName: 'Nisha Mehta',
  parentPhone: '+91 98765 43210',
  teacherName: 'Priya Sharma',
  teacherPhone: '+91 99887 76655',
  activityName: 'Science Fun',
  address: 'Bandra West, Mumbai',
  bookingId: 'BK-12589',
  triggeredAt: new Date().toISOString(),
}

function parseAlert(detail: unknown): SosAlert {
  if (!detail || typeof detail !== 'object') {
    return FALLBACK_ALERT
  }

  return { ...FALLBACK_ALERT, ...(detail as Partial<SosAlert>) }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

export function SosAlertLayer({ session }: { session: AdminSession }) {
  const [state, setState] = useState<AlertState>({ status: 'idle', alert: null })

  useEffect(() => {
    function handleSos(event: Event) {
      const customEvent = event as CustomEvent
      setState({ status: 'active', alert: parseAlert(customEvent.detail) })
    }

    window.addEventListener('beam:sos-preview', handleSos)
    window.addEventListener('beam:sos-triggered', handleSos)

    return () => {
      window.removeEventListener('beam:sos-preview', handleSos)
      window.removeEventListener('beam:sos-triggered', handleSos)
    }
  }, [])

  if (state.status === 'idle' || state.alert === null) {
    return null
  }

  if (state.status === 'acknowledged') {
    return (
      <div className="sos-banner" role="status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#059669', color: 'white', padding: '4px', borderRadius: '6px' }}>
            <UserCheck size={16} />
          </div>
          <div>
            <strong>SOS Acknowledged</strong>
            <span>
              {state.alert.childName}&apos;s session is being monitored. Acknowledged by {state.acknowledgedBy} at{' '}
              {formatTime(state.acknowledgedAt)}.
            </span>
          </div>
        </div>
        <button className="sos-banner__close" type="button" onClick={() => setState({ status: 'idle', alert: null })}>
          Dismiss
        </button>
      </div>
    )
  }

  const alert = state.alert

  return (
    <div className="sos-layer" role="alertdialog" aria-modal="true" aria-labelledby="sos-title">
      <section className="sos-panel">
        <div className="sos-panel__header">
          <div>
            <p className="sos-panel__eyebrow">Critical Safety Alert</p>
            <h2 id="sos-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={28} strokeWidth={2.5} />
              SOS Triggered
            </h2>
          </div>
          <span className="sos-panel__id">Ref: {alert.bookingId}</span>
        </div>

        <div className="sos-panel__body">
          {/* Safety Flow Visualization */}
          <div className="sos-flow">
            <div className="sos-flow__node sos-flow__node--teacher">
              <div className="sos-flow__icon">
                <User size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="sos-flow__label">Teacher</div>
                <div className="sos-flow__name">{alert.teacherName}</div>
              </div>
            </div>

            <div className="sos-flow__arrow">
              <div style={{
                position: 'absolute',
                top: '-24px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontWeight: 900,
                color: '#DC2626',
                background: '#FFEDED',
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                ALARM TRIGGERED
              </div>
            </div>

            <div className="sos-flow__node sos-flow__node--parent">
              <div className="sos-flow__icon">
                <User size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="sos-flow__label">Parent</div>
                <div className="sos-flow__name">{alert.parentName}</div>
              </div>
            </div>

            <div className="sos-flow__arrow">
              <div style={{
                position: 'absolute',
                top: '-24px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontWeight: 900,
                color: '#059669',
                background: '#ECFDF5',
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                NOTIFYING
              </div>
            </div>

            <div className="sos-flow__node sos-flow__node--admin">
              <div className="sos-flow__icon">
                <ShieldAlert size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="sos-flow__label">Admin (You)</div>
                <div className="sos-flow__name">Monitoring</div>
              </div>
            </div>
          </div>

          <div className="sos-panel__primary">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} />
              Child in session
            </span>
            <strong>{alert.childName}, {alert.childAge}y</strong>
          </div>
          <div className="sos-panel__primary">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} />
              Live Location
            </span>
            <strong>{alert.address}</strong>
          </div>

          <div className="sos-detail-grid">
            <div>
              <span>Contact Parent</span>
              <strong>{alert.parentName}</strong>
              <a href={`tel:${alert.parentPhone.replace(/\s/g, '')}`}>
                <Phone size={14} />
                {alert.parentPhone}
              </a>
            </div>
            <div>
              <span>Contact Teacher</span>
              <strong>{alert.teacherName}</strong>
              <a href={`tel:${alert.teacherPhone.replace(/\s/g, '')}`}>
                <Phone size={14} />
                {alert.teacherPhone}
              </a>
            </div>
            <div>
              <span>Active Activity</span>
              <strong>{alert.activityName}</strong>
              <span style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7, textTransform: 'none' }}>
                Standard Safety Protocol Active
              </span>
            </div>
            <div>
              <span>Timestamp</span>
              <strong>{formatTime(alert.triggeredAt)}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '12px', fontWeight: 700 }}>
                <Clock size={12} />
                Real-time alert
              </div>
            </div>
          </div>
        </div>

        <div className="sos-panel__actions">
          <button
            className="btn btn--primary"
            type="button"
            style={{ flex: 1, height: '42px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setState({
              status: 'acknowledged',
              alert,
              acknowledgedBy: session.name,
              acknowledgedAt: new Date().toISOString(),
            })}
          >
            Acknowledge & Monitor
          </button>
          <a
            className="btn btn--danger"
            href={`tel:${alert.parentPhone.replace(/\s/g, '')}`}
            style={{ flex: 1, height: '42px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <Phone size={16} />
            Emergency Call
          </a>
        </div>
      </section>
    </div>
  )
}


