import type { BookingStatus, Teacher } from '@beam/schemas'

export type QueryLikeResult<TData> = {
  data: TData | undefined
  isError: boolean
  isLoading: boolean
  refetch: () => void
}

export type TeacherSession = {
  id: string
  bookingStatusSource: 'mock-booking'
  status: BookingStatus
  activityTitle: string
  childName: string
  dateLabel: string
  timeRange: string
  location: string
}

export type TeacherDashboard = {
  todaySessionCount: number
  pendingChecklistCount: number
  earningsPreview: string
  nextSession: TeacherSession | null
}

export type ChecklistItem = {
  id: string
  title: string
  required: boolean
  completed: boolean
}

export type ChecklistGroup = {
  sessionId: string
  activityTitle: string
  childName: string
  timeRange: string
  items: ChecklistItem[]
}

export type TeacherChecklist = {
  groups: ChecklistGroup[]
}

export type TeacherEarnings = {
  upcomingPayout: string
  awaitingPayoutCount: number
  payouts: Array<{
    id: string
    amount: string
    dateLabel: string
    status: 'paid' | 'processing' | 'held'
  }>
}

export type TeacherProfile = {
  teacher: Teacher
  initials: string
  city: string
  languages: string[]
  skills: string[]
  availabilitySummary: string
  verificationStatus: 'Verified' | 'Pending verification' | 'Needs review'
}
