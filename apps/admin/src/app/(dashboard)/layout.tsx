import { DashboardShell } from '@/components/layout/DashboardShell'
import { getAdminSession } from '@/lib/admin-access'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  return <DashboardShell session={session}>{children}</DashboardShell>
}
