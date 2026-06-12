import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'

export function useChildren() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['children', user?.id],
    queryFn: () => parentApi.children.list(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}
