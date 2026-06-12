import { useQuery } from '@tanstack/react-query'
import { parentApi } from '@/lib/api'

type Filters = {
  category?: string
  ageGroup?: string
  search?: string
  page?: number
  limit?: number
  lat?: number
  lng?: number
  radiusKm?: number
}

export function useActivities(filters?: Filters) {
  return useQuery({
    queryKey: [
      'activities',
      filters?.category,
      filters?.ageGroup,
      filters?.search,
      filters?.page,
      filters?.limit,
      filters?.lat,
      filters?.lng,
      filters?.radiusKm,
    ],
    queryFn: () => parentApi.activities.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => parentApi.activities.get(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}
