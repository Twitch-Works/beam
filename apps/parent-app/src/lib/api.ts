import { supabase } from './supabase'

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

export const parentApi = {
  activities: {
    list: (params?: { category?: string; ageGroup?: string; search?: string; page?: number; limit?: number; lat?: number; lng?: number; radiusKm?: number }) => {
      const q = new URLSearchParams()
      if (params?.category)  q.set('category',  params.category)
      if (params?.ageGroup)  q.set('ageGroup',   params.ageGroup)
      if (params?.search)    q.set('search',     params.search)
      if (params?.page)      q.set('page',       String(params.page))
      if (params?.limit)     q.set('limit',      String(params.limit))
      if (params?.lat != null) q.set('lat',      String(params.lat))
      if (params?.lng != null) q.set('lng',      String(params.lng))
      if (params?.radiusKm)  q.set('radiusKm',   String(params.radiusKm))
      const qs = q.toString()
      return apiFetch<{ items: Activity[]; total: number; page: number; limit: number }>(
        `/activities${qs ? `?${qs}` : ''}`,
      )
    },
    get: (id: string) => apiFetch<ActivityDetail>(`/activities/${id}`),
    slots: (activityId: string, from: string, days = 7, teacherId?: string | null) => {
      const q = new URLSearchParams({ from, days: String(days) })
      if (teacherId) q.set('teacherId', teacherId)
      return apiFetch<{ slots: Record<string, Slot[]>; from: string; to: string }>(
        `/activities/${activityId}/slots?${q.toString()}`,
      )
    },
  },
  bookings: {
    list: (parentId: string, params?: { status?: string }) => {
      const q = new URLSearchParams({ parentId })
      if (params?.status) q.set('status', params.status)
      return apiFetch<{ items: Booking[] }>(`/bookings?${q.toString()}`)
    },
    create: (body: {
      parentId: string; childId: string; activityId: string; slotId: string
      totalAmount: number; discountCode?: string; discountAmount?: number
    }) => apiFetch<{ booking: Booking; payment: PaymentSummary }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    get: (bookingId: string, parentId: string) =>
      apiFetch<Booking>(`/bookings/${bookingId}?parentId=${parentId}`),
    reschedule: (bookingId: string, parentId: string, newSlotId: string) =>
      apiFetch<{ ok: boolean; booking: Booking }>(`/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ parentId, newSlotId }),
      }),
    cancel: (bookingId: string, parentId: string) =>
      apiFetch<{ ok: boolean; booking: Booking }>(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ parentId }),
      }),
    verifyOtp: (bookingId: string, parentId: string, otp: string) =>
      apiFetch<{ ok: boolean; booking: Booking }>(`/bookings/${bookingId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ parentId, otp }),
      }),
    complete: (bookingId: string, parentId: string) =>
      apiFetch<{ ok: boolean; booking: Booking }>(`/bookings/${bookingId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ parentId }),
      }),
    submitFeedback: (bookingId: string, parentId: string, rating: number, comment?: string) =>
      apiFetch<{ ok: boolean }>(`/bookings/${bookingId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ parentId, rating, comment }),
      }),
  },
  payments: {
    createOrder: (bookingId: string) =>
      apiFetch<{ orderId: string; amount: number; currency: string; keyId: string }>(
        '/payments/orders', { method: 'POST', body: JSON.stringify({ bookingId }) },
      ),
    verifyPayment: (bookingId: string, body: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) =>
      apiFetch<{ ok: boolean }>(`/payments/${bookingId}/verify`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  teachers: {
    get: (teacherId: string) => apiFetch<Teacher>(`/teachers/${teacherId}`),
  },
  children: {
    list: (parentId: string) =>
      apiFetch<{ items: Child[] }>(`/children?parentId=${parentId}`),
    progress: (childId: string) =>
      apiFetch<ChildProgress>(`/children/${childId}/progress`),
    update: (childId: string, parentId: string, body: { firstName?: string; lastName?: string; dateOfBirth?: string }) =>
      apiFetch<Child>(`/children/${childId}`, {
        method: 'PATCH',
        body: JSON.stringify({ parentId, ...body }),
      }),
  },

  coupons: {
    validate: (code: string, orderAmount: number) =>
      apiFetch<CouponResult>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, orderAmount }),
      }),
  },

  users: {
    me: (params: { authUserId?: string; email?: string; phone?: string }) => {
      const q = new URLSearchParams()
      if (params.authUserId) q.set('authUserId', params.authUserId)
      if (params.email) q.set('email', params.email)
      if (params.phone) q.set('phone', params.phone)
      return apiFetch<ParentUser>(`/users/me?${q.toString()}`)
    },
    registerParent: (body: { userId?: string; email: string; firstName: string; lastName: string; phone?: string }) =>
      apiFetch<{ id: string }>('/users/register-parent', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateProfile: (body: { userId: string; firstName?: string; lastName?: string; city?: string; phone?: string }) =>
      apiFetch<{ ok: boolean }>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
}

export type ActivityDetail = Activity & {
  description: string
  materialsNeeded: string | null
  preparationNotes: string | null
  reviewCount: number
  teacherId: string | null
  teachers: ActivityTeacher[]
  category: { id: string; name: string; color: string } | null
}

export type Slot = {
  id: string
  teacherId?: string | null
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  teacherFirstName: string | null
  teacherLastName: string | null
}

export type Child = {
  id: string
  firstName: string
  lastName: string | null
  dateOfBirth: string
}

export type ParentUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  city: string | null
  role: 'parent' | 'teacher' | 'admin' | 'super_admin'
}

export type Activity = {
  id: string
  title: string
  description: string
  ageGroup: string
  sessionType: string
  sessionDurationMins: number
  pricePerSession: string
  imageUrl: string | null
  tags: string[]
  categoryId: string
  categoryName: string | null
  categoryColor: string | null
  totalBookings: number
  avgRating: string | null
  distanceKm?: number | null
}

export type Booking = {
  id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  sessionType: string
  totalAmount: string
  scheduledAt: string | null
  createdAt: string
  confirmedAt?: string | null
  teacherOtp?: string | null
  teacherOtpVerifiedAt?: string | null
  completedAt?: string | null
  parentCompletedAt?: string | null
  payoutQueuedAt?: string | null
  payoutReleasedAt?: string | null
  canReschedule?: boolean
  canComplete?: boolean
  otpVisible?: boolean
  paymentStatus?: 'pending' | 'success' | 'failed' | 'refunded' | null
  activityId: string | null
  activityTitle: string | null
  activityImage: string | null
  activityDuration: number | null
  teacherId: string | null
  teacherFirstName: string | null
  teacherLastName: string | null
  childFirstName: string | null
  childLastName: string | null
}

export type PaymentSummary = {
  id: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  gatewayPaymentId?: string | null
}

export type Teacher = {
  id: string
  firstName: string
  lastName: string | null
  bio: string | null
  city: string | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
  specializations: string[]
  totalSessions: number
  activities: {
    id: string
    title: string
    pricePerSession: string
    sessionDurationMins: number
    ageGroup: string
    imageUrl: string | null
  }[]
}

export type ActivityTeacher = {
  id: string
  firstName: string
  lastName: string | null
  bio: string | null
  city: string | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
  specializations: string[]
  totalSessions: number
}

export type ChildProgress = {
  skills: { creativity: number; motor: number; language: number; social: number; focus: number }
  badges: { id: string; label: string; icon: string; iconColor: string; bg: string }[]
  teacherNote: { teacherName: string; note: string; date: string } | null
  totalSessions: number
}

export type CouponResult = {
  code: string
  type: 'flat' | 'percent'
  value: number
  discountAmount: number
  finalAmount: number
}
