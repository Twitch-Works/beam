'use client'

import { AdminSidebar, SidebarProvider, useSidebar } from '@/components/layout/Sidebar'
import { AdminTopbar } from '@/components/layout/Topbar'
import { SosAlertLayer } from '@/components/safety/SosAlertLayer'
import { MockModeProvider } from '@/lib/mock-mode'
import type { AdminSession } from '@/lib/admin-access'

function Shell({ children, session }: { children: React.ReactNode; session: AdminSession }) {
  const { collapsed } = useSidebar()
  return (
    <div
      className="admin-shell"
      data-sidebar-collapsed={collapsed ? 'true' : 'false'}
    >
      <AdminSidebar session={session} />
      <div className="admin-body">
        <AdminTopbar session={session} />
        <main className="admin-content" id="main-content">
          {children}
        </main>
      </div>
      <SosAlertLayer session={session} />
    </div>
  )
}

export function DashboardShell({ children, session }: { children: React.ReactNode; session: AdminSession }) {
  return (
    <MockModeProvider>
      <SidebarProvider>
        <Shell session={session}>{children}</Shell>
      </SidebarProvider>
    </MockModeProvider>
  )
}
