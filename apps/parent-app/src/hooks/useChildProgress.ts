import { useQuery } from '@tanstack/react-query'
import { parentApi } from '@/lib/api'

export function useChildProgress(childId: string | null | undefined) {
  return useQuery({
    queryKey: ['child-progress', childId],
    queryFn: () => parentApi.children.progress(childId!),
    enabled: !!childId,
    staleTime: 1000 * 60 * 2,
  })
}
