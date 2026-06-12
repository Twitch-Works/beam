'use client'

import { useState, useEffect } from 'react'
import { Zap, LayoutTemplate, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { adminApi } from '@/lib/api'

type NotifChannel = 'push' | 'whatsapp' | 'email' | 'sms'
type NotifStatus  = 'delivered' | 'failed' | 'queued'

interface Template {
  key: string
  name: string
  channels: NotifChannel[]
  isActive: boolean
}

interface Campaign {
  id: string
  title: string
  audience: string
  channels: NotifChannel[]
  scheduledAt: string
  sent: number
  failed: number
  status: 'sent' | 'scheduled' | 'cancelled'
}

interface DeliveryLog {
  id: string
  userId: string
  userName: string
  templateKey: string
  status: NotifStatus
  sentAt: string
  message: string
}

const TRIGGER_LABEL: Record<string, string> = {
  'booking.confirmed':  'On booking confirmation',
  'session.reminder':   '24 hours before session',
  'session.reminder_1h': '1 hour before session',
  'payment.failed':     'On payment failure',
  'payment.refunded':   'On refund processed',
  'teacher.assigned':   'On teacher assignment',
  'booking.cancelled':  'On booking cancellation',
  'review.request':     '2 hours after completion',
  'session.started':    'When session is started',
  'payout.settled':     'On payout settled',
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'CP001', title: 'Summer Kickoff 2024', audience: 'All active parents', channels: ['push', 'email'], scheduledAt: '2024-05-15 10:00', sent: 0, failed: 0, status: 'scheduled' },
  { id: 'CP002', title: 'Yoga Week Promo', audience: 'Parents with yoga bookings', channels: ['push', 'whatsapp'], scheduledAt: '2024-04-20 09:00', sent: 284, failed: 12, status: 'sent' },
  { id: 'CP003', title: 'Teacher Appreciation Message', audience: 'All active teachers', channels: ['push', 'email'], scheduledAt: '2024-05-01 10:00', sent: 45, failed: 2, status: 'sent' },
  { id: 'CP004', title: 'New City Launch — Kochi', audience: 'Parents in Kochi', channels: ['push', 'sms', 'whatsapp'], scheduledAt: '2024-04-10 08:00', sent: 0, failed: 0, status: 'cancelled' },
]

const CHANNEL_COLORS: Record<NotifChannel, { bg: string; color: string; label: string }> = {
  push:      { bg: 'var(--color-mint)', color: 'var(--color-primary)', label: 'Push' },
  whatsapp:  { bg: '#DCF8C6', color: '#128C7E', label: 'WhatsApp' },
  email:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Email' },
  sms:       { bg: '#FEF3C7', color: '#B45309', label: 'SMS' },
}

const STATUS_DOT: Record<NotifStatus, string> = {
  delivered: '#22C55E',
  failed:    '#EF4444',
  queued:    '#FCB857',
}

function ChannelTags({ channels }: { channels: NotifChannel[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {channels.map(ch => (
        <span key={ch} style={{
          background: CHANNEL_COLORS[ch].bg, color: CHANNEL_COLORS[ch].color,
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99
        }}>{CHANNEL_COLORS[ch].label}</span>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'templates' | 'campaigns' | 'logs'>('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [logs, setLogs] = useState<DeliveryLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [kpis, setKpis] = useState({ deliveredToday: 0, failedToday: 0, queued: 0 })

  useEffect(() => {
    adminApi.notifications.list().then(data => {
      setTemplates(data.templates as Template[])
      setLogs(data.logs.items.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        userName: [l.userFirstName, l.userLastName].filter(Boolean).join(' ') || l.userId,
        templateKey: l.type,
        status: l.isRead ? 'delivered' : 'queued',
        sentAt: new Date(l.createdAt).toLocaleString('en-IN'),
        message: l.body,
      })))
      setLogsTotal(data.logs.total)
      setKpis(data.kpis)
    }).catch(() => {
      // API unavailable — leave empty; page shows "no data"
    })
  }, [])

  const tabs = [
    { key: 'templates' as const, label: 'Templates', count: templates.length },
    { key: 'campaigns' as const, label: 'Campaigns', count: MOCK_CAMPAIGNS.length },
    { key: 'logs' as const, label: 'Delivery Logs', count: logsTotal },
  ]

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Template management, campaigns, and delivery visibility">
        {tab === 'campaigns' && (
          /* TODO: navigate to /notifications/campaigns/new */
          <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            + New Campaign
          </button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Templates Active', value: templates.filter(t => t.isActive).length, delta: 'Across 4 channels', up: true, Icon: LayoutTemplate, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Delivered Today', value: kpis.deliveredToday, delta: 'Sent successfully', up: true, Icon: CheckCircle2, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Failed Today', value: kpis.failedToday, delta: kpis.failedToday > 0 ? 'Needs attention' : 'All clear', up: false, Icon: AlertCircle, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Queued', value: kpis.queued, delta: 'Pending dispatch', up: false, Icon: Clock, iconBg: '#FEF3C7', iconColor: '#B45309' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Tab Container */}
      <div className="table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 24px' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-gray)',
                borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 8, background: tab === t.key ? 'var(--color-mint)' : '#F1F5F9',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-gray)',
                borderRadius: 99, padding: '2px 8px', fontSize: 12
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {tab === 'templates' && (
          <div>
            {templates.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-gray)', fontSize: 14 }}>Loading templates…</div>
            )}
            {templates.map((t, i) => (
              <div key={t.key} style={{
                padding: '18px 24px', borderBottom: i < templates.length - 1 ? '1px solid #F8FAFC' : 'none',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: t.isActive ? '#22C55E' : '#94A3B8'
                    }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-navy)' }}>{t.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-gray)', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{t.key}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingLeft: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-gray)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={12} color="var(--color-yellow)" strokeWidth={2.5} />{TRIGGER_LABEL[t.key] ?? 'Automated trigger'}
                    </span>
                    <ChannelTags channels={t.channels as NotifChannel[]} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--ghost btn--sm">Edit</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{t.isActive ? 'On' : 'Off'}</span>
                    <div style={{
                      width: 36, height: 20, borderRadius: 99,
                      background: t.isActive ? 'var(--color-primary)' : '#CBD5E1',
                      cursor: 'pointer', position: 'relative'
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: t.isActive ? 18 : 2, transition: 'left 0.2s'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaigns Tab */}
        {tab === 'campaigns' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Audience</th>
                  <th>Channels</th>
                  <th>Scheduled</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CAMPAIGNS.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{c.title}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{c.audience}</td>
                    <td><ChannelTags channels={c.channels} /></td>
                    <td style={{ fontSize: 13 }}>{c.scheduledAt}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#22C55E' }}>{c.sent || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c.failed > 0 ? 'var(--color-coral)' : 'var(--color-gray)' }}>{c.failed || '—'}</td>
                    <td>
                      <span className={c.status === 'sent' ? 'badge badge--confirmed' : c.status === 'scheduled' ? 'badge badge--pending' : 'badge badge--cancelled'}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {c.status === 'scheduled' && (
                        /* TODO: DELETE /api/admin/notifications/campaigns/:id */
                        <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral)' }}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delivery Logs Tab */}
        {tab === 'logs' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Template</th>
                  <th>Message Preview</th>
                  <th>Sent At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No delivery logs yet.</td></tr>
                )}
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-navy)' }}>{l.userName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>{l.userId.slice(0, 8)}…</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-primary)' }}>{l.templateKey}</td>
                    <td style={{ fontSize: 13, color: '#374151', maxWidth: 240 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.message}</span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{l.sentAt}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[l.status] }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_DOT[l.status] }}>
                          {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                        </span>
                      </div>
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
