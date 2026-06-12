import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi, type NotificationRow } from '../lib/api'

export { type NotificationRow }

export function useNotifications() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.notifications.list(user.id)
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 30,
  })
}

export function useMarkNotificationRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.notifications.markRead(notificationId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.notifications.markAllRead(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
