import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi } from '../lib/api'

function formatAmount(raw: string | null | undefined): string {
  const n = parseFloat(raw ?? '0')
  if (isNaN(n)) return '₹0'
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const today = new Date()
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

export function useTeacherDashboard() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')

      const [sessionsData, earningsData] = await Promise.all([
        teacherApi.sessions.list(user.id),
        teacherApi.earnings.get(user.id),
      ])

      const active = sessionsData.items.filter(s => s.status === 'confirmed' || s.status === 'pending')
      const todaySessions = active.filter(s => isToday(s.scheduledAt))

      const nextSession = active
        .filter(s => s.scheduledAt)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0] ?? null

      let nextSessionFormatted = null
      if (nextSession) {
        const d = new Date(nextSession.scheduledAt!)
        const start = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
        nextSessionFormatted = {
          id:           nextSession.id,
          bookingStatusSource: 'api' as const,
          status:       nextSession.status,
          activityTitle: nextSession.activityTitle ?? '—',
          childName:    [nextSession.childFirstName, nextSession.childLastName].filter(Boolean).join(' ') || '—',
          dateLabel:    isToday(nextSession.scheduledAt) ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          timeRange:    start,
          location:     nextSession.parentCity ? `Home · ${nextSession.parentCity}` : 'Home',
        }
      }

      return {
        todaySessionCount:    todaySessions.length,
        pendingChecklistCount: 0, // checklist is local-state only
        earningsPreview:      formatAmount(earningsData.pendingPayout),
        nextSession:          nextSessionFormatted,
      }
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 30,
  })
}
