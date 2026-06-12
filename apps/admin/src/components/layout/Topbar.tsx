'use client'

import { IconSearch, IconCalendar, IconChevronDown, IconBell } from '@/components/icons'
import { useSidebar } from '@/components/layout/Sidebar'
import { useMockMode } from '@/lib/mock-mode'
import type { AdminSession } from '@/lib/admin-access'

export function AdminTopbar({ session }: { session: AdminSession }) {
  const { toggle } = useSidebar()
  const { mockMode, toggleMockMode } = useMockMode()

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="topbar" role="banner">
      {/* Mobile hamburger — hidden on desktop via CSS */}
      <button
        className="topbar__hamburger"
        onClick={toggle}
        aria-label="Toggle navigation"
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Global search */}
      <div className="topbar__search">
        <span className="topbar__search-icon" aria-hidden="true">
          <IconSearch size={16} />
        </span>
        <input
          id="global-search"
          type="search"
          className="topbar__search-input"
          placeholder="Search children, teachers, activities..."
          aria-label="Global search"
        />
        <div className="topbar__search-shortcut">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </div>
      </div>

      <div className="topbar__actions">
        {/* Date chip — hidden on small screens */}
        <button className="topbar__date-chip" type="button" aria-label="Date filter">
          <IconCalendar size={15} />
          <span className="topbar__date-text">{today}</span>
          <IconChevronDown size={13} />
        </button>

        {/* Notification bell */}
        <button className="topbar__bell" type="button" aria-label="Notifications (12 unread)">
          <IconBell size={18} />
          <span className="topbar__bell-badge" aria-hidden="true"></span>
        </button>

        <button
          className="topbar__sos-btn"
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('beam:sos-preview', {
              detail: {
                id: `SOS-${Date.now()}`,
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
              },
            }))
          }}
        >
          SOS
        </button>

        {/* Mock data toggle & API URL */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={toggleMockMode}
            title={mockMode ? 'Using mock data — click to use live API' : 'Using live API — click to use mock data'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${mockMode ? '#FCB857' : '#E2E8F0'}`,
              background: mockMode ? '#FEF3C7' : '#F8FAFC',
              color: mockMode ? '#92400E' : '#64748B',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: mockMode ? '#FCB857' : '#22C55E',
              flexShrink: 0,
            }} />
            {mockMode ? 'Mock' : 'Live'}
          </button>
          <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}>
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
          </span>
        </div>

        <div className="topbar__divider" />

        {/* Quick action button */}
        <button className="topbar__create-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create New</span>
        </button>
        <span className="topbar__role-chip">{session.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
      </div>
    </header>
  )
}
