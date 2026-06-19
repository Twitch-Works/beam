import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import { parentApi } from '@/lib/api'

export function useChildren() {
  const { parentUserId } = useAuth()
  console.log("Parent User ID:", parentUserId)
  return useQuery({
    queryKey: ['children', parentUserId],
    queryFn: () => parentApi.children.list(parentUserId!),
    enabled: !!parentUserId,
    staleTime: 1000 * 60 * 2,
  })
}
