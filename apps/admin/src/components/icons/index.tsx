/**
 * Beam Admin — icon library
 * All icons are inline SVG (Lucide-style, 18×18, stroke-2, currentColor).
 * Import named exports. Never use emojis in UI.
 */

type IconProps = {
  size?: number
  className?: string
  style?: React.CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
}

const defaultProps = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/* ── Navigation ─────────────────────────────────────────────────────────── */

export function IconHome({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function IconUsers({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

export function IconTeacher({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M9 11l-4 2 4 2" />
    </svg>
  )
}

export function IconActivity({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

export function IconCalendar({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconPayment({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M1 10h22" />
    </svg>
  )
}

export function IconStar({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function IconDispute({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconAnalytics({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function IconRevenue({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

export function IconEngagement({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

export function IconReport({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

export function IconCoupon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

export function IconBell({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

export function IconSettings({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

export function IconAudit({ size = 18, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

/* ── KPI / Dashboard ─────────────────────────────────────────────────────── */

export function IconUserCircle({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconBookingCalendar({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  )
}

export function IconRupee({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M6 3h12M6 8h12M6 13l8.5 8" />
      <path d="M6 8a6 6 0 006 6" />
      <path d="M6 3a6 6 0 016 5" />
    </svg>
  )
}

export function IconCheckCircle({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export function IconShield({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

/* ── Activity icons ──────────────────────────────────────────────────────── */

export function IconPaintbrush({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 00-3-3z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5L4.5 15" />
    </svg>
  )
}

export function IconScissors({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

export function IconBook({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}

export function IconLeaf({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M17 8C8 10 5.9 16.17 3.82 22" />
      <path d="M17 8C17 8 18 18 6 22" />
      <path d="M17 8c0 0-12 0-14 14" />
    </svg>
  )
}

export function IconFlask({ size = 20, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M9 3h6M9 3v9l-5 9h16l-5-9V3" />
    </svg>
  )
}

/* ── Alert strip ─────────────────────────────────────────────────────────── */

export function IconUserCheck({ size = 16, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  )
}

export function IconAlertTriangle({ size = 16, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconSparkle({ size = 16, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    </svg>
  )
}

/* ── Topbar ──────────────────────────────────────────────────────────────── */

export function IconSearch({ size = 16, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconChevronDown({ size = 13, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* ── Misc ────────────────────────────────────────────────────────────────── */

export function IconTrendUp({ size = 14, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function IconTrendDown({ size = 14, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

export function IconExternalLink({ size = 14, ...p }: IconProps) {
  return (
    <svg {...defaultProps(size)} {...p}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

/* ── KPI icon map ────────────────────────────────────────────────────────── */

const KPI_ICONS: Record<string, React.ComponentType<IconProps>> = {
  users:    IconUserCircle,
  bookings: IconBookingCalendar,
  revenue:  IconRupee,
  sessions: IconCheckCircle,
  teachers: IconShield,
}

export function KpiIcon({ id, size = 20 }: { id: string; size?: number }) {
  const Icon = KPI_ICONS[id]
  return Icon ? <Icon size={size} /> : null
}

/* ── Activity icon map ───────────────────────────────────────────────────── */

const ACTIVITY_ICONS: Record<string, React.ComponentType<IconProps>> = {
  'messy-play':   IconPaintbrush,
  'art-craft':    IconScissors,
  'storytelling': IconBook,
  'sensory-play': IconLeaf,
  'science-fun':  IconFlask,
}

export function ActivityIcon({ id, size = 20 }: { id: string; size?: number }) {
  const Icon = ACTIVITY_ICONS[id]
  return Icon ? <Icon size={size} /> : null
}

/* ── Star rating (solid filled stars, no emoji) ──────────────────────────── */

export function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: '#FCB857' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="12" height="12" viewBox="0 0 24 24"
          fill={n <= rating ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.5"
          aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}
