import { useQuery } from '@tanstack/react-query'
import { parentApi } from '@/lib/api'

export function useSlots(activityId: string | null, from: string, days = 7) {
  return useQuery({
    queryKey: ['slots', activityId, from, days],
    queryFn: () => parentApi.activities.slots(activityId!, from, days),
    enabled: !!activityId,
    staleTime: 1000 * 30,
  })
}
