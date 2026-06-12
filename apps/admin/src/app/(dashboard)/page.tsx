'use client'

import { useState, useEffect } from 'react'
import { useMockMode } from '@/lib/mock-mode'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  dashboardKpis, recentBookings, topActivities, teacherPerformance,
  bookingSegments, userSegments, recentFeedback, reviewsSummary,
  growthCards, trendData, signupBars,
} from '@/lib/mock-data'
import { formatInr, formatCount } from '@/lib/formatters'
import {
  KpiIcon, ActivityIcon, StarRating,
  IconTrendUp, IconUserCheck, IconAlertTriangle, IconSparkle,
} from '@/components/icons'
import { adminApi } from '@/lib/api'
import { SkeletonStatCard } from '@/components/Skeleton'
import { ApiFallbackBanner } from '@/components/ui/ApiFallbackBanner'

type LiveKpis = {
  totalUsers: number
  activeBookings: number
  totalRevenue: number
  sessionsCompleted: number
  verifiedTeachers: number
}

export default function DashboardPage() {
  const { mockMode: USE_MOCK_DATA } = useMockMode()
  const [mounted, setMounted] = useState(false)
  const [liveKpis, setLiveKpis] = useState<LiveKpis | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (USE_MOCK_DATA) { setLoading(false); return }
    setLoading(true)
    setApiUnavailable(false)
    void (async () => {
      try {
        const data = await adminApi.analytics.overview()
        setLiveKpis(data.kpis)
        setApiUnavailable(false)
      } catch {
        setApiUnavailable(true)
      }
      finally { setLoading(false) }
    })()
  }, [USE_MOCK_DATA])

  return (
    <div>
      {/* Hero */}
      <div className="dashboard-hero">
        <h1>Welcome back, Super Admin!</h1>
        <p className="dashboard-hero__sub">Here&apos;s what&apos;s happening on Beam today.</p>
      </div>
      {apiUnavailable && <ApiFallbackBanner />}

      {/* KPI row */}
      {loading ? (
        <div className="kpi-grid">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="kpi-grid">
          {dashboardKpis.map((kpi, i) => {
            const liveValues = liveKpis ? [
              formatCount(liveKpis.totalUsers),
              String(liveKpis.activeBookings),
              formatInr(liveKpis.totalRevenue),
              formatCount(liveKpis.sessionsCompleted),
              String(liveKpis.verifiedTeachers),
            ] : null
            const displayValue = liveValues ? liveValues[i] : kpi.value
            return (
              <article key={kpi.id} className="card stat-card">
                <div>
                  <p className="stat-card__label">{kpi.label}</p>
                  <p className="stat-card__value">{displayValue}</p>
                  <p className={`stat-card__delta stat-card__delta--${kpi.deltaDir}`}>
                    <IconTrendUp size={12} />
                    {kpi.delta} <span style={{ color: 'var(--color-gray)', fontWeight: 400 }}>vs last 30 days</span>
                  </p>
                </div>
                <div className={`stat-card__icon stat-card__icon--${kpi.tone}`} aria-hidden="true">
                  <KpiIcon id={kpi.icon} size={24} />
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Chart row */}
      <div className="dashboard-row dashboard-row--charts">
        {/* Revenue Overview */}
        <article className="card">
          <div className="section-card__header">
            <div>
              <h2 className="section-card__title">Revenue Overview</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <LegendDot color="var(--color-primary)" label="Revenue (₹)" />
                <LegendDot color="var(--color-yellow)" label="Bookings" />
              </div>
            </div>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          {mounted ? <RevenueChart data={trendData} /> : <div style={{ height: 180 }} />}
        </article>

        {/* Bookings Overview */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Bookings Overview</h2>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          {mounted ? <BookingDonut segments={bookingSegments} total={2248} /> : <div style={{ height: 220 }} />}
        </article>
      </div>

      {/* Mid row — Recent Bookings (2fr) | Top Activities (1fr) */}
      <div className="dashboard-row dashboard-row--mid">
        {/* Recent Bookings */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Recent Bookings</h2>
            <a href="/bookings" className="section-card__link">View all</a>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Child &amp; Activity</th>
                  <th>Teacher</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-gray)' }}>{b.id}</td>
                    <td>
                      <div className="cell-person">
                        <div className="avatar avatar--sm">{b.childName[0]}</div>
                        <div>
                          <div>{b.activityName}</div>
                          <div className="cell-sub">{b.childName}, {b.childAge} yrs</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-person">
                        <div className="avatar avatar--sm">{b.teacherName[0]}</div>
                        <div>
                          <div style={{ fontSize: 12 }}>{b.teacherName}</div>
                          <div className="cell-sub">
                            <StarRating rating={Math.round(b.teacherRating)} />
                            {' '}{b.teacherRating}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray)' }}>{b.dateTime}</td>
                    <td><span className={`badge badge--${b.status}`}>{capitalise(b.status)}</span></td>
                    <td className="cell-mono">{formatInr(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Top Activities */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Top Activities</h2>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topActivities.map((a) => (
              <li key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                  <ActivityIcon id={a.icon} size={20} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-gray)' }}>{formatCount(a.bookings)} bookings</div>
                </div>
              </li>
            ))}
          </ul>
          <a href="/activities" className="section-card__link" style={{ display: 'block', marginTop: 16 }}>View all activities</a>
        </article>
      </div>

      {/* Sub-mid row — Teacher Perf (1fr) | User Signups (1fr) */}
      <div className="dashboard-row dashboard-row--sub-mid">
        {/* Teacher Performance */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Teacher Performance</h2>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th style={{ textAlign: 'right' }}>Sessions</th>
                  <th style={{ textAlign: 'right' }}>Rating</th>
                  <th style={{ textAlign: 'right' }}>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {teacherPerformance.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <div className="cell-person">
                        <div className="avatar avatar--sm">{t.name[0]}</div>
                        <span style={{ fontSize: 12 }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{t.sessions}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
                        <StarRating rating={Math.round(t.rating)} />
                        {t.rating}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatInr(t.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a href="/teachers" className="section-card__link" style={{ display: 'block', marginTop: 16 }}>View all teachers</a>
        </article>

        {/* User Signups */}
        <article className="card card--flex-column">
          <div className="section-card__header">
            <h2 className="section-card__title">User Signups</h2>
            <button className="time-chip" type="button">This Week <ChevronIcon /></button>
          </div>
          <div className="card__chart-content">
            {mounted ? <SignupBars data={signupBars} /> : <div style={{ height: '100%' }} />}
          </div>
        </article>
      </div>

      {/* Bottom row */}
      <div className="dashboard-row dashboard-row--bottom">
        {/* User Distribution */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">User Distribution</h2>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          {mounted ? <UserDonut segments={userSegments} total={12485} /> : <div style={{ height: 200 }} />}
        </article>

        {/* Growth Overview */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Growth Overview</h2>
            <button className="time-chip" type="button">Last 6 Months <ChevronIcon /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {growthCards.map((g) => (
              <div key={g.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>{g.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--color-success)', fontSize: 15 }}>
                  <IconTrendUp size={13} />
                  {g.pct}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Reviews Summary */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Reviews Summary</h2>
            <button className="time-chip" type="button">This Month <ChevronIcon /></button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 700, color: 'var(--color-navy)' }}>{reviewsSummary.avg}</div>
            <StarRating rating={Math.round(reviewsSummary.avg)} />
            <div style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 4 }}>({formatCount(reviewsSummary.total)} reviews)</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {reviewsSummary.bars.map((b) => (
              <div key={b.stars} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 20, color: 'var(--color-gray)', textAlign: 'right' }}>{b.stars}</span>
                <StarIcon />
                <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 3 }}>
                  <div style={{ width: `${b.pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3 }} />
                </div>
                <span style={{ width: 28, color: 'var(--color-gray)', textAlign: 'right' }}>{b.pct}%</span>
              </div>
            ))}
          </div>
        </article>

        {/* Recent Feedback */}
        <article className="card">
          <div className="section-card__header">
            <h2 className="section-card__title">Recent Feedback</h2>
            <a href="/reviews" className="section-card__link">View all</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recentFeedback.map((f) => (
              <div key={f.parent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="cell-person" style={{ gap: 6 }}>
                    <div className="avatar avatar--sm">{f.parent[0]}</div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{f.parent}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-gray)' }}>{f.timeAgo}</span>
                </div>
                <StarRating rating={f.rating} />
                <div style={{ fontSize: 11, color: 'var(--color-gray)', marginTop: 2 }}>{f.activity}</div>
                <p style={{ fontSize: 12, color: 'var(--color-navy)', marginTop: 4, lineHeight: 1.5 }}>{f.comment}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Alert strip */}
      <div className="alert-strip">
        <div className="alert-strip__item alert-strip__item--teal">
          <div className="alert-strip__icon">
            <IconUserCheck size={18} />
          </div>
          <div className="alert-strip__body">
            <p className="alert-strip__text">
              You have <strong>8 teachers pending verification</strong> — review their documents before they go live.
            </p>
            <a href="/teachers/verification" className="alert-strip__btn alert-strip__btn--teal">Review Now</a>
          </div>
        </div>
        <div className="alert-strip__item alert-strip__item--amber">
          <div className="alert-strip__icon">
            <IconAlertTriangle size={18} />
          </div>
          <div className="alert-strip__body">
            <p className="alert-strip__text">
              <strong>3 refund requests</strong> are pending your attention and may breach SLA soon.
            </p>
            <a href="/disputes" className="alert-strip__btn alert-strip__btn--amber">View Requests</a>
          </div>
        </div>
        <div className="alert-strip__item alert-strip__item--green">
          <div className="alert-strip__icon">
            <IconSparkle size={18} />
          </div>
          <div className="alert-strip__body">
            <p className="alert-strip__text">
              New feature: <strong>Growth Insights Report</strong> is now live — explore trends and forecasts.
            </p>
            <a href="/analytics/reports" className="alert-strip__btn alert-strip__btn--green">Explore Now</a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ display: 'inline', marginLeft: 2 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" strokeWidth="1"
      style={{ fill: 'var(--color-yellow)', stroke: 'var(--color-yellow)' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-gray)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </div>
  )
}

function compact(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

/* ── Recharts chart components ─────────────────────────────────────────────── */

type TrendPoint = { label: string; revenue: number; bookings: number }

function RevenueChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={compact}
          width={52}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
          formatter={(value, name) => [
            name === 'revenue' ? formatInr(value as number) : String(value),
            name === 'revenue' ? 'Revenue' : 'Bookings',
          ]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#1787A6" strokeWidth={2.5}
          dot={{ fill: '#1787A6', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="bookings" stroke="#FCB857" strokeWidth={2.5}
          dot={{ fill: '#FCB857', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

type BookingSegment = { label: string; count: number; pct: number; color: string }

function BookingDonut({ segments, total }: { segments: BookingSegment[]; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={segments} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
              dataKey="count" nameKey="label" startAngle={90} endAngle={-270} strokeWidth={0}>
              {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              formatter={(value) => [Number(value).toLocaleString('en-IN')]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--color-navy)', lineHeight: 1 }}>
            {total.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-gray)', marginTop: 2 }}>Total</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--color-gray)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-navy)' }}>{s.count.toLocaleString('en-IN')}</span>
            <span style={{ color: 'var(--color-gray)', minWidth: 40, textAlign: 'right' }}>({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type SignupBar = { day: string; count: number }

function SignupBars({ data }: { data: SignupBar[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(241, 245, 249, 0.6)', radius: 6 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="chart-tooltip">
                  <p className="chart-tooltip__label">{label}</p>
                  <p className="chart-tooltip__value">
                    <span className="chart-tooltip__dot" style={{ backgroundColor: 'var(--color-primary)' }} />
                    {payload[0].value} <span className="chart-tooltip__unit">Signups</span>
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar
          dataKey="count"
          fill="var(--color-primary)"
          radius={[6, 6, 0, 0]}
          name="Signups"
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

type UserSegment = { label: string; count: number; pct: number; color: string }

function UserDonut({ segments, total }: { segments: UserSegment[]; total: number }) {
  return (
    <div>
      <div style={{ position: 'relative', width: 150, height: 160, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={segments} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
              dataKey="count" nameKey="label" startAngle={90} endAngle={-270} strokeWidth={0}>
              {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              formatter={(value) => [Number(value).toLocaleString('en-IN')]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--color-navy)', lineHeight: 1 }}>
            {total.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-gray)', marginTop: 2 }}>Total Users</span>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--color-gray)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{s.count.toLocaleString('en-IN')}</span>
            <span style={{ color: 'var(--color-gray)' }}>({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
