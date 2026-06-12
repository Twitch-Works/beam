import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi } from '../lib/api'

export function useAvailability() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-availability', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const { availability } = await teacherApi.availability.get(user.id)
      return availability
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpdateAvailability() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (availability: Record<string, string[]>) => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.availability.update(user.id, availability)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-availability'] })
    },
  })
}
