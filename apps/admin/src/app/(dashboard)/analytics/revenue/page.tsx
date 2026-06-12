'use client'

import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { IndianRupee, TrendingUp, RotateCcw, Banknote } from 'lucide-react'

// TODO: const { data } = useAnalytics({ scope: 'revenue', range })

const MONTHLY_REVENUE = [
  { month: 'Oct', gross: 142000, net: 113600, refunds: 8400, payouts: 99050 },
  { month: 'Nov', gross: 168000, net: 134400, refunds: 6200, payouts: 117600 },
  { month: 'Dec', gross: 182000, net: 145600, refunds: 7100, payouts: 127400 },
  { month: 'Jan', gross: 214000, net: 171200, refunds: 9800, payouts: 149800 },
  { month: 'Feb', gross: 198000, net: 158400, refunds: 5400, payouts: 138600 },
  { month: 'Mar', gross: 267000, net: 213600, refunds: 11200, payouts: 186900 },
  { month: 'Apr', gross: 312000, net: 249600, refunds: 14300, payouts: 218400 },
  { month: 'May', gross: 289000, net: 231200, refunds: 9600, payouts: 202300 },
]

const PAYOUT_STATUS = [
  { month: 'Feb', settled: 138600, dispatched: 0, queued: 0 },
  { month: 'Mar', settled: 186900, dispatched: 0, queued: 0 },
  { month: 'Apr', settled: 190000, dispatched: 14200, queued: 14200 },
  { month: 'May', settled: 100000, dispatched: 42000, queued: 60300 },
]

const CATEGORY_REVENUE = [
  { category: 'Dance', revenue: 312000 },
  { category: 'Music', revenue: 278000 },
  { category: 'Wellness', revenue: 187000 },
  { category: 'Technology', revenue: 156000 },
  { category: 'Art', revenue: 134000 },
  { category: 'Life Skills', revenue: 98000 },
  { category: 'Mental Sports', revenue: 87000 },
]

const RANGE_OPTIONS = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last Year']

function formatINR(n: number) { return '₹' + n.toLocaleString('en-IN') }

export default function RevenueAnalyticsPage() {
  const [range, setRange] = useState('Last 6 Months')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>Revenue Analytics</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-gray)', fontSize: 14 }}>Gross revenue, payouts, refunds, and platform margin</p>
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
          {/* TODO: POST /api/admin/analytics/revenue/export */}
          <button className="btn btn--secondary btn--sm" style={{ marginLeft: 8 }}>Export</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="kpi-grid kpi-grid--4">
        {[
          { label: 'Gross Revenue', value: formatINR(1772000), delta: '+14% vs prior period', up: true, Icon: IndianRupee, iconBg: 'var(--color-mint)', iconColor: 'var(--color-primary)' },
          { label: 'Net Revenue (after refunds)', value: formatINR(1417600), delta: '80% collection rate', up: true, Icon: TrendingUp, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Total Refunds Issued', value: formatINR(71600), delta: '4% refund rate', up: false, Icon: RotateCcw, iconBg: '#FEE2E2', iconColor: '#DC2626' },
          { label: 'Payouts Dispatched', value: formatINR(1239550), delta: '87% of net revenue', up: true, Icon: Banknote, iconBg: '#DBEAFE', iconColor: '#2563EB' },
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

      {/* Revenue vs Payouts Area Chart */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Gross Revenue vs Payouts vs Refunds</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ color: '#1787A6', label: 'Gross Revenue' }, { color: '#A7BBFA', label: 'Payouts' }, { color: '#FF7A59', label: 'Refunds' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-gray)' }}>
                <div style={{ width: 10, height: 3, borderRadius: 99, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={MONTHLY_REVENUE} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1787A6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1787A6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPayouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A7BBFA" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#A7BBFA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number, name: string) => [formatINR(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }} />
            <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="#1787A6" fill="url(#gradRevenue)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#A7BBFA" fill="url(#gradPayouts)" strokeWidth={2} />
            <Line type="monotone" dataKey="refunds" name="Refunds" stroke="#FF7A59" strokeWidth={2} dot={{ fill: '#FF7A59', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Category Revenue Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Revenue by Activity Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CATEGORY_REVENUE} layout="vertical" barSize={16} margin={{ top: 0, right: 16, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [formatINR(v), 'Revenue']} contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#1787A6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payout Status stacked bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Payout Pipeline by Month</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PAYOUT_STATUS} barSize={36} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => [formatINR(v), name]} contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="settled" name="Settled" fill="#22C55E" stackId="a" radius={[0,0,4,4]} />
              <Bar dataKey="dispatched" name="Dispatched" fill="#1787A6" stackId="a" />
              <Bar dataKey="queued" name="Queued" fill="#FCB857" stackId="a" radius={[4,4,0,0]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
