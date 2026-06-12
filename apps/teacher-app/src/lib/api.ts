import { supabase } from './supabase'

declare const process: { env: Record<string, string | undefined> }
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://beam-api-xi.vercel.app'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Response types ───────────────────────────────────────────────────────────

export type TeacherSessionRow = {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
  sessionType: string
  totalAmount: string
  scheduledAt: string | null
  notes: string | null
  activityId: string | null
  activityTitle: string | null
  activityImage: string | null
  activityDuration: number | null
  childFirstName: string | null
  childLastName: string | null
  childDob: string | null
  parentId: string
  parentFirstName: string | null
  parentPhone: string | null
  parentCity: string | null
}

export type TeacherProfileRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  city: string | null
  avatarUrl: string | null
  bio: string | null
  specializations: string[]
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rating: string
  reviewCount: number
  totalSessions: number
}

export type EarningsRow = {
  totalEarned: string
  totalSessions: number
  pendingPayout: string
  awaitingPayoutCount: number
  payouts: Array<{
    id: string
    amount: string
    status: 'queued' | 'dispatched' | 'settled' | 'failed'
    sessionCount: number
    scheduledAt: string | null
    settledAt: string | null
    createdAt: string
  }>
}

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, any> | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

// ─── API client ───────────────────────────────────────────────────────────────

export const teacherApi = {
  sessions: {
    list: (teacherId: string, status?: string) => {
      const q = new URLSearchParams({ teacherId })
      if (status) q.set('status', status)
      return apiFetch<{ items: TeacherSessionRow[] }>(`/teacher/sessions?${q}`)
    },
  },

  bookings: {
    updateStatus: (bookingId: string, teacherId: string, status: 'confirmed' | 'completed' | 'cancelled') =>
      apiFetch<TeacherSessionRow>(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ teacherId, status }),
      }),
  },

  profile: {
    get: (userId: string) =>
      apiFetch<TeacherProfileRow>(`/teacher/profile?userId=${userId}`),

    update: (body: { userId: string; firstName?: string; lastName?: string; city?: string; bio?: string; phone?: string; specializations?: string[] }) =>
      apiFetch<{ ok: boolean }>('/teacher/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  availability: {
    get: (userId: string) =>
      apiFetch<{ availability: Record<string, string[]> | null }>(`/teacher/availability?userId=${userId}`),

    update: (userId: string, availability: Record<string, string[]>) =>
      apiFetch<{ ok: boolean }>('/teacher/availability', {
        method: 'PATCH',
        body: JSON.stringify({ userId, availability }),
      }),
  },

  earnings: {
    get: (teacherId: string) =>
      apiFetch<EarningsRow>(`/teacher/earnings?teacherId=${teacherId}`),
  },

  notifications: {
    list: (userId: string, limit = 30) =>
      apiFetch<{ items: NotificationRow[]; unreadCount: number }>(
        `/notifications?userId=${userId}&limit=${limit}`,
      ),

    markRead: (notificationId: string, userId: string) =>
      apiFetch<{ ok: boolean }>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      }),

    markAllRead: (userId: string) =>
      apiFetch<{ ok: boolean }>('/notifications/read-all', {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      }),
  },
}
