// Mock data for Phase 2 dashboard — replace with real API calls

export type DashboardKpi = {
  id: string
  label: string
  value: string
  delta: string
  deltaDir: 'up' | 'down'
  tone: 'teal' | 'yellow' | 'green' | 'lavender' | 'blue'
  icon: string
}

export const dashboardKpis: DashboardKpi[] = [
  { id: 'users',    label: 'Total Users',       value: '12,485',      delta: '18.6%', deltaDir: 'up',   tone: 'teal',    icon: 'users' },
  { id: 'bookings', label: 'Active Bookings',    value: '2,248',       delta: '12.4%', deltaDir: 'up',   tone: 'yellow',  icon: 'bookings' },
  { id: 'revenue',  label: 'Total Revenue',      value: '₹24,58,000',  delta: '22.8%', deltaDir: 'up',   tone: 'green',   icon: 'revenue' },
  { id: 'sessions', label: 'Sessions Completed', value: '1,842',       delta: '15.2%', deltaDir: 'up',   tone: 'lavender',icon: 'sessions' },
  { id: 'teachers', label: 'Verified Teachers',  value: '326',         delta: '9.3%',  deltaDir: 'up',   tone: 'blue',    icon: 'teachers' },
]

export type RecentBooking = {
  id: string
  childName: string
  childAge: number
  activityName: string
  teacherName: string
  teacherRating: number
  dateTime: string
  status: 'upcoming' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled'
  amount: number
}

export const recentBookings: RecentBooking[] = [
  { id: 'BK-12589', childName: 'Aarav',   childAge: 3, activityName: 'Messy Play Session',  teacherName: 'Ms. Priya Sharma', teacherRating: 4.9, dateTime: '16 May, 4:00 PM',  status: 'upcoming',  amount: 649 },
  { id: 'BK-12588', childName: 'Ishita',  childAge: 4, activityName: 'Storytelling Circle', teacherName: 'Mr. Arjun Verma',  teacherRating: 4.8, dateTime: '16 May, 5:30 PM',  status: 'confirmed', amount: 599 },
  { id: 'BK-12587', childName: 'Vihaan',  childAge: 5, activityName: 'Art & Craft',         teacherName: 'Ms. Neha Iyer',    teacherRating: 4.9, dateTime: '17 May, 11:00 AM', status: 'upcoming',  amount: 649 },
  { id: 'BK-12586', childName: 'Ananya',  childAge: 6, activityName: 'Science Fun',         teacherName: 'Mr. Karan Mehta',  teacherRating: 4.7, dateTime: '17 May, 3:00 PM',  status: 'confirmed', amount: 749 },
  { id: 'BK-12585', childName: 'Reyansh', childAge: 3, activityName: 'Puppet Show',         teacherName: 'Ms. Priya Sharma', teacherRating: 4.9, dateTime: '18 May, 4:00 PM',  status: 'cancelled', amount: 649 },
]

export type TopActivity = {
  name: string
  bookings: number
  icon: string
}

export const topActivities: TopActivity[] = [
  { name: 'Messy Play',     bookings: 243, icon: 'messy-play' },
  { name: 'Art & Craft',    bookings: 218, icon: 'art-craft' },
  { name: 'Storytelling',   bookings: 189, icon: 'storytelling' },
  { name: 'Sensory Play',   bookings: 176, icon: 'sensory-play' },
  { name: 'Science Fun',    bookings: 142, icon: 'science-fun' },
]

export type TeacherPerformance = {
  name: string
  sessions: number
  rating: number
  earnings: number
}

export const teacherPerformance: TeacherPerformance[] = [
  { name: 'Ms. Priya Sharma', sessions: 45, rating: 4.9, earnings: 32450 },
  { name: 'Mr. Arjun Verma',  sessions: 38, rating: 4.8, earnings: 27620 },
  { name: 'Ms. Neha Iyer',    sessions: 34, rating: 4.9, earnings: 24880 },
  { name: 'Mr. Karan Mehta',  sessions: 32, rating: 4.7, earnings: 22150 },
  { name: 'Ms. Ananya Das',   sessions: 28, rating: 4.8, earnings: 19430 },
]

export type BookingSegment = { label: string; count: number; pct: number; color: string }
export const bookingSegments: BookingSegment[] = [
  { label: 'Completed',   count: 1452, pct: 64.6, color: '#1787A6' },
  { label: 'Upcoming',    count: 512,  pct: 22.8, color: '#FCB857' },
  { label: 'Cancelled',   count: 184,  pct: 8.2,  color: '#FF7A59' },
  { label: 'Rescheduled', count: 100,  pct: 4.4,  color: '#A7BBFA' },
]

export type UserSegment = { label: string; count: number; pct: number; color: string }
export const userSegments: UserSegment[] = [
  { label: 'Parents',      count: 8245, pct: 66.0, color: '#1787A6' },
  { label: 'Teachers',     count: 2845, pct: 22.8, color: '#A7BBFA' },
  { label: 'Kids Profiles',count: 1395, pct: 11.2, color: '#FCB857' },
]

export type FeedbackItem = {
  parent: string
  activity: string
  rating: number
  comment: string
  timeAgo: string
}
export const recentFeedback: FeedbackItem[] = [
  { parent: "Aarav's Parent",  activity: 'Messy Play Session',  rating: 5, comment: 'Great session! Aarav loved the activities. Very engaging teacher.', timeAgo: '2h ago' },
  { parent: "Ishita's Parent", activity: 'Storytelling Circle', rating: 5, comment: 'Wonderful experience. My daughter was so happy!', timeAgo: '5h ago' },
]

export const reviewsSummary = {
  avg: 4.8,
  total: 1248,
  bars: [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 16 },
    { stars: 3, pct: 4  },
    { stars: 2, pct: 1  },
    { stars: 1, pct: 1  },
  ],
}

export const growthCards = [
  { label: 'Users',    pct: '+18.6%' },
  { label: 'Bookings', pct: '+24.3%' },
  { label: 'Revenue',  pct: '+22.8%' },
]

// Revenue/Bookings trend data — 7 points across May
export type TrendPoint = { label: string; revenue: number; bookings: number }
export const trendData: TrendPoint[] = [
  { label: '1 May',  revenue: 320000, bookings: 38 },
  { label: '5 May',  revenue: 480000, bookings: 52 },
  { label: '10 May', revenue: 420000, bookings: 45 },
  { label: '15 May', revenue: 560000, bookings: 61 },
  { label: '20 May', revenue: 640000, bookings: 70 },
  { label: '25 May', revenue: 720000, bookings: 82 },
  { label: '30 May', revenue: 800000, bookings: 90 },
]

// Signup bars — Mon-Sun
export type SignupBar = { day: string; count: number }
export const signupBars: SignupBar[] = [
  { day: 'Mon', count: 320 },
  { day: 'Tue', count: 480 },
  { day: 'Wed', count: 620 },
  { day: 'Thu', count: 390 },
  { day: 'Fri', count: 560 },
  { day: 'Sat', count: 210 },
  { day: 'Sun', count: 175 },
]
