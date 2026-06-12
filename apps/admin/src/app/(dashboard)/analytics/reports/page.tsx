'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { IndianRupee, Banknote, CalendarDays, Users, Star, Scale, Palette, BarChart2, FileText } from 'lucide-react'

// TODO: POST /api/admin/analytics/reports/generate
// TODO: GET /api/admin/analytics/reports (previously generated)

interface ReportCard {
  id: string
  title: string
  description: string
  formats: string[]
  category: string
  estimatedRows: string
  Icon: LucideIcon
}

const REPORT_CATALOG: ReportCard[] = [
  { id: 'revenue-monthly', title: 'Monthly Revenue Report', description: 'Gross revenue, net revenue, refunds, and platform margin broken down by month and category.', formats: ['CSV', 'PDF'], category: 'Finance', estimatedRows: '~500 rows', Icon: IndianRupee },
  { id: 'payout-summary', title: 'Teacher Payout Summary', description: 'Full payout history per teacher: sessions count, amounts, status, and settlement dates.', formats: ['CSV', 'PDF'], category: 'Finance', estimatedRows: '~200 rows', Icon: Banknote },
  { id: 'bookings-export', title: 'All Bookings Export', description: 'Complete booking ledger with parent, child, teacher, activity, city, date, amount, and status.', formats: ['CSV'], category: 'Operations', estimatedRows: '~1,200 rows', Icon: CalendarDays },
  { id: 'user-directory', title: 'Parent & Child Directory', description: 'Full user directory with contact info, number of children, and booking history summary.', formats: ['CSV'], category: 'Users', estimatedRows: '~400 rows', Icon: Users },
  { id: 'teacher-performance', title: 'Teacher Performance Report', description: 'Rating averages, sessions completed, response times, and complaint counts per teacher.', formats: ['CSV', 'PDF'], category: 'Operations', estimatedRows: '~50 rows', Icon: Star },
  { id: 'dispute-log', title: 'Disputes & Resolutions Log', description: 'All disputes with type, priority, parent, teacher, amounts, resolution status, and time-to-resolve.', formats: ['CSV', 'PDF'], category: 'Operations', estimatedRows: '~120 rows', Icon: Scale },
  { id: 'activities-catalog', title: 'Activities Catalog Export', description: 'All activities with category, age group, pricing, bookings count, average rating, and status.', formats: ['CSV'], category: 'Curriculum', estimatedRows: '~80 rows', Icon: Palette },
  { id: 'engagement-overview', title: 'Engagement & Retention Report', description: 'Signup funnel, repeat booking rates, DAU/MAU per city, and booking conversion rates.', formats: ['CSV', 'PDF'], category: 'Analytics', estimatedRows: '~300 rows', Icon: BarChart2 },
]

interface GeneratedReport {
  id: string
  reportId: string
  title: string
  generatedAt: string
  format: string
  rows: number
  generatedBy: string
}

const MOCK_GENERATED: GeneratedReport[] = [
  { id: 'G001', reportId: 'revenue-monthly', title: 'Monthly Revenue Report', generatedAt: '2024-05-07 14:30', format: 'CSV', rows: 487, generatedBy: 'Admin User' },
  { id: 'G002', reportId: 'bookings-export', title: 'All Bookings Export', generatedAt: '2024-05-06 10:15', format: 'CSV', rows: 1143, generatedBy: 'Admin User' },
  { id: 'G003', reportId: 'teacher-performance', title: 'Teacher Performance Report', generatedAt: '2024-05-01 09:00', format: 'PDF', rows: 12, generatedBy: 'Admin User' },
  { id: 'G004', reportId: 'payout-summary', title: 'Teacher Payout Summary', generatedAt: '2024-04-30 16:45', format: 'CSV', rows: 189, generatedBy: 'Admin User' },
]

const CATEGORIES = ['All', 'Finance', 'Operations', 'Users', 'Curriculum', 'Analytics']

export default function ReportsPage() {
  const [category, setCategory] = useState('All')
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedReport[]>(MOCK_GENERATED)

  const filtered = category === 'All' ? REPORT_CATALOG : REPORT_CATALOG.filter(r => r.category === category)

  function handleGenerate(report: ReportCard, format: string) {
    setGenerating(report.id)
    // TODO: POST /api/admin/analytics/reports/generate { reportId: report.id, format }
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: `G${Date.now()}`,
        reportId: report.id,
        title: report.title,
        generatedAt: new Date().toLocaleString('en-IN'),
        format,
        rows: Math.floor(Math.random() * 500) + 50,
        generatedBy: 'Admin User',
      }
      setGenerated(prev => [newReport, ...prev])
      setGenerating(null)
    }, 2000)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-navy)' }}>Reports</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-gray)', fontSize: 14 }}>Generate and download operational reports</p>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: '6px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: category === c ? 'var(--color-primary)' : '#fff',
              color: category === c ? '#fff' : 'var(--color-gray)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >{c}</button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
        {filtered.map(r => (
          <div key={r.id} style={{
            background: '#fff', borderRadius: 16, padding: 24,
            border: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--color-mint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <r.Icon size={20} color="var(--color-primary)" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-navy)', marginBottom: 4 }}>{r.title}</div>
                <span style={{ background: '#F1F5F9', color: 'var(--color-gray)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                  {r.category}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{r.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={12} color="var(--color-gray)" />
              <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>{r.estimatedRows}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              {r.formats.map(f => (
                <button
                  key={f}
                  onClick={() => handleGenerate(r, f)}
                  disabled={generating === r.id}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, cursor: generating ? 'default' : 'pointer',
                    background: generating === r.id ? '#E2E8F0' : f === 'PDF' ? '#EDE9FE' : 'var(--color-primary)',
                    color: generating === r.id ? '#94A3B8' : f === 'PDF' ? '#7C3AED' : '#fff',
                    fontWeight: 600, fontSize: 13, transition: 'all 0.15s'
                  }}
                >
                  {generating === r.id ? 'Generating…' : `↓ ${f}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>Recently Generated</h3>
        {generated.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-gray)' }}>No reports generated yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Format</th>
                <th>Rows</th>
                <th>Generated By</th>
                <th>Generated At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {generated.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: 14 }}>{g.title}</td>
                  <td>
                    <span style={{
                      background: g.format === 'PDF' ? '#EDE9FE' : 'var(--color-mint)',
                      color: g.format === 'PDF' ? '#7C3AED' : 'var(--color-primary)',
                      fontWeight: 600, fontSize: 12, padding: '2px 8px', borderRadius: 6
                    }}>{g.format}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g.rows.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{g.generatedBy}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray)' }}>{g.generatedAt}</td>
                  <td>
                    {/* TODO: GET /api/admin/analytics/reports/:id/download */}
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-primary)' }}>Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
