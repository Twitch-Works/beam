import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'

export function useBookings(statusFilter?: string) {
  const { parentUserId } = useAuth()
  return useQuery({
    queryKey: ['bookings', parentUserId, statusFilter],
    queryFn: () => parentApi.bookings.list(parentUserId!, { status: statusFilter }),
    enabled: !!parentUserId,
    staleTime: 1000 * 30,
  })
}
