import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi } from '../lib/api'

export function useTeacherProfile() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const profile = await teacherApi.profile.get(user.id)
      const initials = [profile.firstName[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase()
      const verificationLabel =
        profile.verificationStatus === 'verified'  ? 'Verified' :
        profile.verificationStatus === 'rejected'  ? 'Needs review' :
                                                     'Pending verification'
      return {
        teacher: {
          id:          profile.id,
          firstName:   profile.firstName,
          lastName:    profile.lastName,
          email:       profile.email,
          phone:       profile.phone,
          avatarUrl:   profile.avatarUrl,
          bio:         profile.bio,
          rating:      parseFloat(profile.rating),
          reviewCount: profile.reviewCount,
        },
        initials,
        city:               profile.city ?? '',
        languages:          profile.specializations,
        skills:             profile.specializations,
        availabilitySummary: '',
        verificationStatus: verificationLabel as 'Verified' | 'Pending verification' | 'Needs review',
        totalSessions:      profile.totalSessions,
        verificationRaw:    profile.verificationStatus,
      }
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { firstName?: string; lastName?: string; city?: string; bio?: string; phone?: string; specializations?: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated')
      return teacherApi.profile.update({ userId: user.id, ...body })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] })
    },
  })
}
