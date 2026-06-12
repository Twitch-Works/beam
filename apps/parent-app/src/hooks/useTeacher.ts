import { useQuery } from '@tanstack/react-query'
import { parentApi } from '@/lib/api'

export function useTeacher(teacherId: string | null) {
  return useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => parentApi.teachers.get(teacherId!),
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5,
  })
}
