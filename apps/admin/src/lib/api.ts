const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export type ApiRecord = Record<string, any>
export type AdminListResponse<TItem = ApiRecord> = {
  items: TItem[]
  total: number
  page?: number
  limit?: number
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> | undefined) },
    })
  } catch {
    // API server unreachable — pages fall back to mock data
    throw new Error(`API unreachable: ${path}`)
  }
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const adminApi = {
  analytics: {
    overview: () => apiFetch<{
      kpis: {
        totalUsers: number
        activeBookings: number
        totalRevenue: number
        sessionsCompleted: number
        verifiedTeachers: number
      }
      recentBookings: Array<{
        id: string
        status: string
        totalAmount: string
        createdAt: string
        parentFirstName: string
        parentLastName: string
        activityTitle: string
      }>
    }>('/admin/analytics/overview'),
  },

  bookings: {
    list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiFetch<AdminListResponse>(
        `/admin/bookings${q.toString() ? `?${q}` : ''}`
      )
    },
    get: (id: string) => apiFetch<ApiRecord>(`/admin/bookings/${id}`),
    assign: (id: string, body: { teacherId: string }) =>
      apiFetch<ApiRecord>(`/admin/bookings/${id}/assign`, { method: 'PATCH', body: JSON.stringify(body) }),
    cancel: (id: string) =>
      apiFetch<ApiRecord>(`/admin/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
  },

  teachers: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.search) q.set('search', params.search)
      return apiFetch<AdminListResponse & { verified: number; pending: number }>(
        `/admin/teachers${q.toString() ? `?${q}` : ''}`
      )
    },
    get: (id: string) => apiFetch<ApiRecord>(`/admin/teachers/${id}`),
    verificationPending: () => apiFetch<AdminListResponse>('/admin/teachers/verification/pending'),
    create: (body: Record<string, unknown>) =>
      apiFetch<{ id: string; userId: string }>('/admin/teachers', { method: 'POST', body: JSON.stringify(body) }),
    verify: (id: string, body: { action: 'verify' | 'reject'; notes?: string }) =>
      apiFetch<ApiRecord>(`/admin/teachers/${id}/verify`, { method: 'PATCH', body: JSON.stringify(body) }),
  },

  disputes: {
    list: (params?: { status?: string; type?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.type) q.set('type', params.type)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiFetch<{
        items: ApiRecord[]
        total: number
        page: number
        limit: number
        kpis: { open: number; underReview: number; highPriority: number; refundAtRisk: number }
      }>(`/admin/disputes${q.toString() ? `?${q}` : ''}`)
    },
  },

  notifications: {
    list: (params?: { page?: number; type?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.type) q.set('type', params.type)
      return apiFetch<{
        templates: ApiRecord[]
        logs: { items: ApiRecord[]; total: number; page: number; limit: number }
        kpis: { deliveredToday: number; failedToday: number; queued: number }
      }>(`/admin/notifications${q.toString() ? `?${q}` : ''}`)
    },
  },

  activities: {
    list: (params?: { status?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      return apiFetch<AdminListResponse>(
        `/admin/activities${q.toString() ? `?${q}` : ''}`
      )
    },
    get: (id: string) => apiFetch<ApiRecord>(`/admin/activities/${id}`),
    create: (body: Record<string, unknown>) =>
      apiFetch<{ id: string }>('/admin/activities', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: ApiRecord) =>
      apiFetch<ApiRecord>(`/admin/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    publish: (id: string) =>
      apiFetch<ApiRecord>(`/admin/activities/${id}/publish`, { method: 'PATCH', body: JSON.stringify({}) }),
    archive: (id: string) =>
      apiFetch<ApiRecord>(`/admin/activities/${id}/archive`, { method: 'PATCH', body: JSON.stringify({}) }),
    slots: (id: string) => apiFetch<{ items: ApiRecord[] }>(`/admin/activities/${id}/slots`),
  },

  slots: {
    create: (body: Record<string, unknown>) =>
      apiFetch<{ id: string }>('/admin/slots', { method: 'POST', body: JSON.stringify(body) }),
  },

  users: {
    list: (params?: { role?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.role) q.set('role', params.role)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      return apiFetch<AdminListResponse>(
        `/admin/users${q.toString() ? `?${q}` : ''}`
      )
    },
    get: (id: string) => apiFetch<ApiRecord>(`/admin/users/${id}`),
  },

  payments: {
    list: (params?: { status?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.page) q.set('page', String(params.page))
      return apiFetch<{ payments: ApiRecord[]; payouts: ApiRecord[]; totals: ApiRecord }>(
        `/admin/payments${q.toString() ? `?${q}` : ''}`
      )
    },
    refund: (bookingId: string) =>
      apiFetch<{ ok: boolean; payment: ApiRecord }>(`/admin/payments/${bookingId}/refund`, { method: 'POST', body: JSON.stringify({}) }),
  },

  reviews: {
    list: (params?: { flagged?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.flagged) q.set('flagged', 'true')
      return apiFetch<{ items: any[]; total: number; avgRating: string; flagged: number }>(
        `/admin/reviews${q.toString() ? `?${q}` : ''}`
      )
    },
  },

  coupons: {
    list: () => apiFetch<{ items: ApiRecord[] }>('/admin/coupons'),
  },

  auditLogs: {
    list: () => apiFetch<AdminListResponse>('/admin/audit-logs'),
  },

  categories: {
    list: () => apiFetch<{ items: ApiRecord[] }>('/admin/categories'),
  },
}
