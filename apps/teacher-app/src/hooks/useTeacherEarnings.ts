import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext'
import { teacherApi } from '../lib/api'

function formatAmount(raw: string | null | undefined): string {
  const n = parseFloat(raw ?? '0')
  if (isNaN(n)) return '₹0'
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function useTeacherEarnings() {
  const { user, isMockSession } = useAuth()

  return useQuery({
    queryKey: ['teacher-earnings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      const data = await teacherApi.earnings.get(user.id)
      return {
        totalEarned:        formatAmount(data.totalEarned),
        totalSessions:      data.totalSessions,
        upcomingPayout:     formatAmount(data.pendingPayout),
        awaitingPayoutCount: data.awaitingPayoutCount,
        payouts: data.payouts.map(p => ({
          id:        p.id,
          amount:    formatAmount(p.amount),
          dateLabel: formatDate(p.settledAt ?? p.scheduledAt ?? p.createdAt),
          status:    (p.status === 'settled' ? 'paid' : p.status === 'failed' ? 'held' : 'processing') as 'paid' | 'processing' | 'held',
        })),
      }
    },
    enabled: !!user?.id && !isMockSession,
    staleTime: 1000 * 60 * 5,
  })
}
