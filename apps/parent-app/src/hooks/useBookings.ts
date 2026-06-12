import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'

export function useBookings(statusFilter?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id, statusFilter],
    queryFn: () => parentApi.bookings.list(user!.id, { status: statusFilter }),
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  })
}
