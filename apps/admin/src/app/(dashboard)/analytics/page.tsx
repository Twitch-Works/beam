'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { IndianRupee, CalendarDays, Users, Star, BadgeCheck } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { adminApi } from '@/lib/api'

const REVENUE_DATA = [
  { month: 'Dec', revenue: 182000, bookings: 142 },
  { month: 'Jan', revenue: 214000, bookings: 168 },
  { month: 'Feb', revenue: 198000, bookings: 151 },
  { month: 'Mar', revenue: 267000, bookings: 203 },
  { month: 'Apr', revenue: 312000, bookings: 241 },
  { month: 'May', revenue: 289000, bookings: 218 },
]

const SIGNUPS_DATA = [
  { week: 'W1', parents: 28, teachers: 4 },
  { week: 'W2', parents: 42, teachers: 6 },
  { week: 'W3', parents: 35, teachers: 3 },
  { week: 'W4', parents: 56, teachers: 8 },
]

const BOOKING_STATUS_DATA = [
  { name: 'Completed', value: 412, color: '#1787A6' },
  { name: 'Confirmed', value: 241, color: '#22C55E' },
  { name: 'Pending',   value: 89,  color: '#FCB857' },
  { name: 'Cancelled', value: 67,  color: '#FF7A59' },
]

const CITY_DATA = [
  { city: 'Mumbai',    bookings: 312, revenue: 187200 },
  { city: 'Bangalore', bookings: 278, revenue: 166800 },
  { city: 'Delhi',     bookings: 245, revenue: 147000 },
  { city: 'Chennai',   bookings: 189, revenue: 113400 },
  { city: 'Pune',      bookings: 156, revenue: 93600 },
  { city: 'Hyderabad', bookings: 134, revenue: 80400 },
]

const TOP_ACTIVITIES = [
  { name: 'Yoga for Kids',       bookings: 412, revenue: 144200, rating: 4.9 },
  { name: 'Bharatanatyam',       bookings: 342, revenue: 205200, rating: 4.9 },
  { name: 'Guitar Lessons',      bookings: 287, revenue: 143500, rating: 4.8 },
  { name: 'Carnatic Vocal',      bookings: 223, revenue: 122650, rating: 4.8 },
  { name: 'Science Experiments', bookings: 201, revenue: 100500, rating: 4.8 },
]

const RANGE_OPTIONS = ['This Week', 'This Month', 'Last 3 Months', 'Last 6 Months']

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('Last 6 Months')
  const [kpis, setKpis] = useState<{
    totalRevenue: number; activeBookings: number; totalUsers: number;
    sessionsCompleted: number; verifiedTeachers: number
  } | null>(null)

  useEffect(() => {
    adminApi.analytics.overview().then(d => setKpis(d.kpis)).catch(() => {})
  }, [])

  return (
    <div>
      {/* Header */}
      <PageHeader title="Analytics Overview" subtitle="Platform-wide revenue, booking, and growth insights">
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 4 }}>
          {RANGE_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: range === r ? '#fff' : 'transparent',
                color: range === r ? 'var(--color-primary)' : 'var(--color-gray)',
                boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >{r}</button>
          ))}
        </div>
      </PageHeader>

      {/* Top KPIs */}
      <div className="kpi-grid">
        {[
          { label: 'Total Revenue', value: kpis ? formatINR(kpis.totalRevenue) : '—', delta: 'All time', up: true, Icon: IndianRupee, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Active Bookings', value: kpis ? String(kpis.activeBookings) : '—', delta: 'Pending + confirmed', up: true, Icon: CalendarDays, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
          { label: 'Total Users', value: kpis ? String(kpis.totalUsers) : '—', delta: 'Parents + teachers', up: true, Icon: Users, iconBg: '#FEF3C7', iconColor: '#B45309' },
          { label: 'Sessions Completed', value: kpis ? String(kpis.sessionsCompleted) : '—', delta: 'All time', up: true, Icon: Star, iconBg: '#FEF3C7', iconColor: '#FCB857' },
          { label: 'Verified Teachers', value: kpis ? String(kpis.verifiedTeachers) : '—', delta: 'Background-checked', up: true, Icon: BadgeCheck, iconBg: '#DCFCE7', iconColor: '#16A34A' },
        ].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Line Chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Revenue Trend</h3>
            <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>Monthly revenue (INR)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REVENUE_DATA} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#1787A6" strokeWidth={2.5} dot={{ fill: '#1787A6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Donut */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Booking Status</h3>
          <div style={{ position: 'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={BOOKING_STATUS_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" paddingAngle={3}>
                  {BOOKING_STATUS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'bookings']} contentStyle={{ borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--color-navy)' }}>809</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray)' }}>total</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {BOOKING_STATUS_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Weekly Signups Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Weekly Signups</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SIGNUPS_DATA} barSize={24} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Bar dataKey="parents" name="Parents" fill="#1787A6" radius={[4,4,0,0]} />
              <Bar dataKey="teachers" name="Teachers" fill="#A7BBFA" radius={[4,4,0,0]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City Breakdown */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>City Breakdown</h3>
          <div>
            {CITY_DATA.map((c, i) => {
              const maxBookings = CITY_DATA[0].bookings
              const pct = (c.bookings / maxBookings) * 100
              return (
                <div key={c.city} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy)' }}>{c.city}</span>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)' }}>{c.bookings} bookings</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{formatINR(c.revenue)}</span>
                    </div>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 99, height: 6 }}>
                    <div style={{ background: 'var(--color-primary)', borderRadius: 99, height: '100%', width: `${pct}%`, opacity: 1 - i * 0.1 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Activities */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Top Activities by Bookings</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Activity</th>
              <th>Total Bookings</th>
              <th>Revenue</th>
              <th>Avg Rating</th>
              <th>Booking Share</th>
            </tr>
          </thead>
          <tbody>
            {TOP_ACTIVITIES.map((a, i) => {
              const maxB = TOP_ACTIVITIES[0].bookings
              return (
                <tr key={a.name}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: i === 0 ? '#FCB857' : 'var(--color-gray)' }}>#{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{a.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{a.bookings}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>{formatINR(a.revenue)}</td>
                  <td style={{ color: '#FCB857', fontFamily: 'var(--font-mono)' }}>★ {a.rating}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#F1F5F9', borderRadius: 99, height: 6, width: 80 }}>
                        <div style={{ background: 'var(--color-primary)', borderRadius: 99, height: '100%', width: `${(a.bookings / maxB) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-gray)', fontFamily: 'var(--font-mono)' }}>
                        {((a.bookings / maxB) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
