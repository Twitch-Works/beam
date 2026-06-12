'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { AdminSession } from '@/lib/admin-access'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

/* ─── Context ─────────────────────────────────────────────────────────────── */

type SidebarCtx = {
  collapsed: boolean
  toggle: () => void
}
const SidebarContext = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} })
export const useSidebar = () => useContext(SidebarContext)

/* ─── Provider (wrap the shell in this) ──────────────────────────────────── */

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = useCallback(() => setCollapsed(v => !v), [])
  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

/* ─── Nav data ────────────────────────────────────────────────────────────── */

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: number }

const mainNav: NavItem[] = [
  { label: 'Dashboard',          href: '/',             icon: <IconHome /> },
  { label: 'Users',              href: '/users',        icon: <IconUsers /> },
  { label: 'Teachers',           href: '/teachers',     icon: <IconTeacher /> },
  { label: 'Activities',         href: '/activities',   icon: <IconActivity /> },
  { label: 'Bookings',           href: '/bookings',     icon: <IconCalendar /> },
  { label: 'Calendar',           href: '/calendar',     icon: <IconCalendarDays /> },
  { label: 'Payments',           href: '/payments',     icon: <IconPayment /> },
  { label: 'Reviews & Feedback', href: '/reviews',      icon: <IconStar /> },
  { label: 'Disputes',           href: '/disputes',     icon: <IconDispute /> },
  { label: 'SOS Alerts',         href: '/sos',           icon: <IconSos />, badge: 1 },
]

const analyticsNav: NavItem[] = [
  { label: 'Overview',   href: '/analytics',            icon: <IconAnalytics /> },
  { label: 'Revenue',    href: '/analytics/revenue',    icon: <IconRevenue /> },
  { label: 'Engagement', href: '/analytics/engagement', icon: <IconEngagement /> },
  { label: 'Reports',    href: '/analytics/reports',    icon: <IconReport /> },
]

const systemNav: NavItem[] = [
  { label: 'Coupons & Offers', href: '/coupons',        icon: <IconCoupon /> },
  { label: 'Notifications',   href: '/notifications',   icon: <IconBell />, badge: 12 },
  { label: 'Settings',        href: '/settings',        icon: <IconSettings /> },
  { label: 'Audit Logs',      href: '/audit-logs',      icon: <IconAudit /> },
]

/* ─── Sidebar component ───────────────────────────────────────────────────── */

export function AdminSidebar({ session }: { session: AdminSession }) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useSidebar()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) =>
    href === '/' || href === '/analytics'
      ? pathname === href
      : pathname.startsWith(href)

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div className="sidebar-backdrop" onClick={toggle} aria-hidden="true" />
      )}

      <aside
        className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand + toggle row */}
        <div className="sidebar__header">
          {!collapsed && <img src="/beam-admin.png" alt="Beam Admin" className="sidebar__logo" />}
          <button
            className="sidebar__toggle"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            <IconChevron collapsed={collapsed} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          <div className="sidebar__group">
            {mainNav.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}
          </div>

          {!collapsed && <p className="sidebar__section-label">Analytics</p>}
          <div className="sidebar__group">
            {analyticsNav.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}
          </div>

          {!collapsed && <p className="sidebar__section-label">System</p>}
          <div className="sidebar__group">
            {systemNav.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* Profile footer */}
        <div className="sidebar__profile-container" ref={profileRef}>
          <button
            className={`sidebar__profile${profileOpen ? ' sidebar__profile--active' : ''}`}
            onClick={() => !collapsed && setProfileOpen(v => !v)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            type="button"
          >
            <div className="sidebar__avatar">{session.role === 'super_admin' ? 'SA' : 'OA'}</div>
            {!collapsed && (
              <>
                <div className="sidebar__profile-info">
                  <p className="sidebar__profile-name">{session.name}</p>
                  <p className="sidebar__profile-role">
                    {session.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
                <IconChevronSmall active={profileOpen} />
              </>
            )}
          </button>

          {profileOpen && !collapsed && (
            <div className="sidebar__profile-menu">
              <button className="sidebar__menu-item" type="button">
                <IconUserSmall />
                <span>My Profile</span>
              </button>
              <button className="sidebar__menu-item" type="button">
                <IconSettingsSmall />
                <span>Account Settings</span>
              </button>
              <div className="sidebar__menu-divider" />
              <button
                className="sidebar__menu-item sidebar__menu-item--danger"
                type="button"
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient()
                  await supabase.auth.signOut()
                  setProfileOpen(false)
                  router.push('/login')
                  router.refresh()
                }}
              >
                <IconLogout />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

/* ─── Sidebar link ────────────────────────────────────────────────────────── */

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [tipY, setTipY] = useState<number | null>(null)

  return (
    <>
      <Link
        ref={linkRef}
        href={item.href}
        className={`sidebar-link${active ? ' sidebar-link--active' : ''}${collapsed ? ' sidebar-link--icon-only' : ''}`}
        aria-current={active ? 'page' : undefined}
        onMouseEnter={() => {
          if (!collapsed) return
          const rect = linkRef.current?.getBoundingClientRect()
          if (rect) setTipY(rect.top + rect.height / 2)
        }}
        onMouseLeave={() => setTipY(null)}
      >
        <span className="sidebar-link__icon" aria-hidden="true">{item.icon}</span>
        {!collapsed && <span className="sidebar-link__label">{item.label}</span>}
        {!collapsed && item.badge != null && item.badge > 0 && (
          <span className="sidebar-link__badge">{item.badge}</span>
        )}
        {collapsed && item.badge != null && item.badge > 0 && (
          <span className="sidebar-link__badge sidebar-link__badge--dot" aria-label={`${item.badge} unread`} />
        )}
      </Link>
      {collapsed && tipY !== null && (
        <div className="sidebar-tooltip" style={{ top: tipY }} role="tooltip">
          {item.label}
          {item.badge != null && item.badge > 0 && (
            <span className="sidebar-tooltip__badge">{item.badge}</span>
          )}
        </div>
      )}
    </>
  )
}

/* ─── Chevron toggle icon ─────────────────────────────────────────────────── */

function IconChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
      aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

/* ─── Inline SVG icons (outline, 18×18) ──────────────────────────────────── */

function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IconHome()       { return <Ico><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></Ico> }
function IconUsers()      { return <Ico><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></Ico> }
function IconTeacher()    { return <Ico><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0114 0v2"/></Ico> }
function IconActivity()   { return <Ico><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Ico> }
function IconCalendar()     { return <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ico> }
function IconCalendarDays() { return <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></Ico> }
function IconPayment()    { return <Ico><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Ico> }
function IconStar()       { return <Ico><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico> }
function IconDispute()    { return <Ico><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></Ico> }
function IconSos()        { return <Ico><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico> }
function IconAnalytics()  { return <Ico><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10H12V2z"/></Ico> }
function IconRevenue()    { return <Ico><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Ico> }
function IconEngagement() { return <Ico><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ico> }
function IconReport()     { return <Ico><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></Ico> }
function IconCoupon()     { return <Ico><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico> }
function IconBell()       { return <Ico><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></Ico> }
function IconSettings()   { return <Ico><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Ico> }
function IconAudit()      { return <Ico><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></Ico> }
function IconLogout() {
  return (
    <Ico>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Ico>
  )
}

function IconUserSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconSettingsSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function IconChevronSmall({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: active ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
