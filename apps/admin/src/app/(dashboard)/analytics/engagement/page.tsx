'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts'
import { UserPlus, TrendingUp, RefreshCw, CalendarDays } from 'lucide-react'

// TODO: const { data } = useAnalytics({ scope: 'engagement', range })

const SIGNUP_TREND = [
  { week: 'Apr W1', parents: 38, teachers: 5 },
  { week: 'Apr W2', parents: 52, teachers: 7 },
  { week: 'Apr W3', parents: 44, teachers: 4 },
  { week: 'Apr W4', parents: 63, teachers: 9 },
  { week: 'May W1', parents: 56, teachers: 6 },
]

const FUNNEL_DATA = [
  { name: 'App Opens', value: 8420, fill: '#1787A6' },
  { name: 'Viewed Activity', value: 5234, fill: '#A7BBFA' },
  { name: 'Selected Slot', value: 2891, fill: '#FCB857' },
  { name: 'Added to Cart', value: 1934, fill: '#FF7A59' },
  { name: 'Booking Confirmed', value: 1267, fill: '#22C55E' },
]

const RETENTION_DATA = [
  { month: 'Jan', rebook: 38 },
  { month: 'Feb', rebook: 42 },
  { month: 'Mar', rebook: 45 },
  { month: 'Apr', rebook: 51 },
  { month: 'May', rebook: 49 },
]

const AGE_DATA = [
  { age: '3–5 yrs', bookings: 189 },
  { age: '6–8 yrs', bookings: 342 },
  { age: '9–11 yrs', bookings: 287 },
  { age: '12–14 yrs', bookings: 203 },
  { age: '15+ yrs', bookings: 102 },
]

const CITY_ENGAGE = [
  { city: 'Mumbai',    dau: 234, mau: 890, repeatRate: 54, avgSessions: 3.2 },
  { city: 'Bangalore', dau: 198, mau: 756, repeatRate: 51, avgSessions: 2.9 },
  { city: 'Delhi',     dau: 167, mau: 634, repeatRate: 48, avgSessions: 2.6 },
  { city: 'Chennai',   dau: 134, mau: 512, repeatRate: 45, avgSessions: 2.4 },
  { city: 'Pune',      dau: 112, mau: 423, repeatRate: 42, avgSessions: 2.1 },
]

const RANGE_OPTIONS = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months']

export default function EngagementPage() {
  const [range, setRange] = useState('Last 3 Months')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>Engagement Analytics</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-gray)', fontSize: 14 }}>Signup trends, booking funnel, retention, and city metrics</p>
        </div>
        <div className="page-header__actions">
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 4 }}>
            {RANGE_OPTIONS.map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: range === r ? '#fff' : 'transparent',
                color: range === r ? 'var(--color-primary)' : 'var(--color-gray)',
                boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Total Signups (Period)', value: '253', delta: '+18% vs prior', up: true, Icon: UserPlus, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Booking Conversion', value: '15.0%', delta: 'App Opens → Booking', up: true, Icon: TrendingUp, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Repeat Booking Rate', value: '49%', delta: 'Parent retention', up: true, Icon: RefreshCw, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
          { label: 'Avg Sessions / Parent', value: '2.8', delta: 'Lifetime average', up: true, Icon: CalendarDays, iconBg: '#FEF3C7', iconColor: '#B45309' },
        ].map(k => (
          <article key={k.label} className="card stat-card">
            <div>
              <p className="stat-card__label">{k.label}</p>
              <p className="stat-card__value">{k.value}</p>
              <p className={`stat-card__delta stat-card__delta--${k.up ? 'up' : 'down'}`}>{k.delta}</p>
            </div>
            <div className="stat-card__icon" style={{ background: k.iconBg, color: k.iconColor }}>
              <k.Icon size={24} strokeWidth={2} />
            </div>
          </article>
        ))}
      </div>

      {/* Row 1: Signup Trend + Booking Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Weekly Signup Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SIGNUP_TREND} barSize={24} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="parents" name="Parents" fill="#1787A6" radius={[4,4,0,0]} />
              <Bar dataKey="teachers" name="Teachers" fill="#A7BBFA" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Funnel */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Booking Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FUNNEL_DATA.map((f, i) => {
              const pct = ((f.value / FUNNEL_DATA[0].value) * 100).toFixed(0)
              const dropPct = i > 0 ? (((FUNNEL_DATA[i-1].value - f.value) / FUNNEL_DATA[i-1].value) * 100).toFixed(0) : null
              return (
                <div key={f.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)' }}>{f.name}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {dropPct && <span style={{ fontSize: 12, color: 'var(--color-coral)' }}>−{dropPct}%</span>}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-navy)' }}>{f.value.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-gray)', width: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 99, height: 8 }}>
                    <div style={{ background: f.fill, borderRadius: 99, height: '100%', width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Repeat Rate + Age Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Repeat Booking Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={RETENTION_DATA} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 60]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Repeat Rate']} contentStyle={{ borderRadius: 8 }} />
              <Line type="monotone" dataKey="rebook" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Bookings by Child Age</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={AGE_DATA} barSize={32} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="bookings" name="Bookings" radius={[4,4,0,0]}>
                {AGE_DATA.map((_, i) => (
                  <Cell key={i} fill={i === 1 ? '#1787A6' : '#A7BBFA'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City Engagement Table */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Engagement by City</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Daily Active Users</th>
              <th>Monthly Active Users</th>
              <th>Repeat Booking Rate</th>
              <th>Avg Sessions / User</th>
            </tr>
          </thead>
          <tbody>
            {CITY_ENGAGE.map((c, i) => (
              <tr key={c.city}>
                <td style={{ fontWeight: 700, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)', width: 20 }}>#{i+1}</span>
                  {c.city}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.dau}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.mau}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#F1F5F9', borderRadius: 99, height: 6, width: 60 }}>
                      <div style={{ background: '#22C55E', borderRadius: 99, height: '100%', width: `${c.repeatRate}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#16A34A' }}>{c.repeatRate}%</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.avgSessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
