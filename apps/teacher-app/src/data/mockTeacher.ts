import type { Teacher } from '@beam/schemas'
import type { ChecklistGroup, TeacherEarnings, TeacherProfile, TeacherSession } from '../types/teacher'

const now = new Date()

export const mockTeacher: Teacher = {
  id: '9f12a7ce-8df3-4aca-9551-c3eb81fca974',
  email: 'ananya.teacher@example.com',
  role: 'teacher',
  firstName: 'Ananya',
  lastName: 'Rao',
  avatarUrl: null,
  bio: 'Creative arts and early-years learning specialist.',
  rating: 4.8,
  reviewCount: 126,
  createdAt: now,
  updatedAt: now,
}

export const mockSessions: TeacherSession[] = [
  {
    id: '5ce82028-87dd-4487-8e8f-bde19f0828d0',
    bookingStatusSource: 'mock-booking',
    status: 'confirmed',
    activityTitle: 'Storytelling and phonics',
    childName: 'Aarav',
    dateLabel: 'Today',
    timeRange: '4:00 PM - 5:00 PM',
    location: 'Indiranagar, Bengaluru',
  },
  {
    id: '99b9d7bd-35f3-4e02-8e41-54660f5ea386',
    bookingStatusSource: 'mock-booking',
    status: 'pending',
    activityTitle: 'Creative clay workshop',
    childName: 'Mira',
    dateLabel: 'Tomorrow',
    timeRange: '11:00 AM - 12:00 PM',
    location: 'Koramangala, Bengaluru',
  },
  {
    id: '53cf47c1-d868-43d2-9023-7ef2b89f988b',
    bookingStatusSource: 'mock-booking',
    status: 'completed',
    activityTitle: 'Beginner rhythm games',
    childName: 'Kabir',
    dateLabel: '18 May',
    timeRange: '3:30 PM - 4:30 PM',
    location: 'HSR Layout, Bengaluru',
  },
]

export const mockChecklistGroups: ChecklistGroup[] = [
  {
    sessionId: mockSessions[0].id,
    activityTitle: mockSessions[0].activityTitle,
    childName: mockSessions[0].childName,
    timeRange: mockSessions[0].timeRange,
    items: [
      { id: 'story-kit', title: 'Pack story cards and phonics mat', required: true, completed: true },
      { id: 'arrival-message', title: 'Send arrival update to parent', required: true, completed: false },
      { id: 'progress-template', title: 'Review previous progress notes', required: false, completed: false },
    ],
  },
  {
    sessionId: mockSessions[1].id,
    activityTitle: mockSessions[1].activityTitle,
    childName: mockSessions[1].childName,
    timeRange: mockSessions[1].timeRange,
    items: [
      { id: 'clay-materials', title: 'Check clay and apron kit', required: true, completed: false },
      { id: 'reference-photos', title: 'Save reference photos offline', required: false, completed: false },
    ],
  },
]

export const mockEarnings: TeacherEarnings = {
  upcomingPayout: '₹4,800',
  awaitingPayoutCount: 3,
  payouts: [
    { id: 'pay-001', amount: '₹3,200', dateLabel: '15 May 2026', status: 'paid' },
    { id: 'pay-002', amount: '₹2,400', dateLabel: '8 May 2026', status: 'paid' },
    { id: 'pay-003', amount: '₹1,600', dateLabel: '1 May 2026', status: 'paid' },
  ],
}

export const mockTeacherProfile: TeacherProfile = {
  teacher: mockTeacher,
  initials: 'AR',
  city: 'Bengaluru',
  languages: ['English', 'Hindi', 'Kannada'],
  skills: ['Storytelling', 'Phonics', 'Creative arts', 'Music play'],
  availabilitySummary: 'Mon, Wed, Fri | 10:00 AM - 6:00 PM',
  verificationStatus: 'Verified',
}
