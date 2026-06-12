import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi, type TeacherSessionRow } from '../lib/api'

function formatScheduled(iso: string | null): { dateLabel: string; timeRange: string } {
  if (!iso) return { dateLabel: '—', timeRange: '—' }
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const sessionDay = new Date(d); sessionDay.setHours(0, 0, 0, 0)

  let dateLabel: string
  if (sessionDay.getTime() === today.getTime()) dateLabel = 'Today'
  else if (sessionDay.getTime() === tomorrow.getTime()) dateLabel = 'Tomorrow'
  else dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const start = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
  return { dateLabel, timeRange: start }
}

function toTeacherSession(row: TeacherSessionRow) {
  const { dateLabel, timeRange } = formatScheduled(row.scheduledAt)
  return {
    id: row.id,
    bookingStatusSource: 'api' as const,
    status: row.status,
    activityTitle: row.activityTitle ?? '—',
    activityImage: row.activityImage,
    activityDuration: row.activityDuration,
    childName: [row.childFirstName, row.childLastName].filter(Boolean).join(' ') || '—',
    childDob: row.childDob,
    parentName: row.parentFirstName ?? '—',
    parentPhone: row.parentPhone,
    parentCity: row.parentCity,
    dateLabel,
    timeRange,
    scheduledAt: row.scheduledAt,
    totalAmount: row.totalAmount,
    location: row.parentCity ? `Home · ${row.parentCity}` : 'Home',
    notes: row.notes,
  }
}

export type SessionItem = ReturnType<typeof toTeacherSession>

export function useTeacherSessions() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const { items } = await teacherApi.sessions.list(user.id)
      const sessions = items.map(toTeacherSession)
      return {
        upcoming:  sessions.filter(s => s.status === 'confirmed' || s.status === 'pending'),
        past:      sessions.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'rescheduled'),
        all:       sessions,
      }
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 30,
  })
}

export function useTeacherSession(bookingId?: string) {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-session', bookingId],
    queryFn: async () => {
      if (!user?.id || !bookingId) return null
      const { items } = await teacherApi.sessions.list(user.id)
      const row = items.find(s => s.id === bookingId)
      return row ? toTeacherSession(row) : null
    },
    enabled: !!user?.id && !!bookingId && !isMockSession,
    staleTime: 1000 * 30,
  })
}

export function useUpdateBookingStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'completed' | 'cancelled' }) => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.bookings.updateStatus(bookingId, user.id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-session'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    },
  })
}
