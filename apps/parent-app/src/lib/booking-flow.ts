import type { Activity } from '@/lib/api'

export type BookingType =
  | 'trial_session'
  | 'single_session'
  | 'four_session_pack'
  | 'recurring_programme'
  | 'sibling_booking'

export type AgeBandId = '2-4' | '5-7' | '8-10'

export type BookingTypeOption = {
  id: BookingType
  label: string
  description: string
  enabled: boolean
  badge?: string
}

export const MAIN_BOOKING_STEP_LABELS = ['Type', 'Slot', 'Child', 'Review', 'Payment']

export const AGE_BANDS: { id: AgeBandId; label: string; midpoint: number }[] = [
  { id: '2-4', label: '2-4', midpoint: 3 },
  { id: '5-7', label: '5-7', midpoint: 6 },
  { id: '8-10', label: '8-10', midpoint: 9 },
]

export function getBookingTypeOptions(activity?: Pick<Activity, 'trialAvailable' | 'activityFormat'> | null): BookingTypeOption[] {
  return [
    {
      id: 'trial_session',
      label: 'Trial session',
      description: activity?.trialAvailable
        ? 'Best first booking if you want to test fit before committing.'
        : 'Available on activities that support a first-time trial.',
      enabled: !!activity?.trialAvailable,
      badge: activity?.trialAvailable ? 'Recommended' : 'Unavailable',
    },
    {
      id: 'single_session',
      label: 'Single session',
      description: 'Book one session now and decide later if you want to continue.',
      enabled: true,
    },
    {
      id: 'four_session_pack',
      label: '4-session pack',
      description: 'Multi-session packs will follow after the core single-session flow is stable.',
      enabled: false,
      badge: 'Coming soon',
    },
    {
      id: 'recurring_programme',
      label: 'Recurring programme',
      description: activity?.activityFormat === 'recurring'
        ? 'Recurring plans are planned next for ongoing programmes.'
        : 'Recurring schedules apply to ongoing programmes and will be enabled next.',
      enabled: false,
      badge: 'Coming soon',
    },
    {
      id: 'sibling_booking',
      label: 'Sibling booking',
      description: 'Sibling bookings need shared-child checkout support and are queued next.',
      enabled: false,
      badge: 'Coming soon',
    },
  ]
}

export function getBookingTypeLabel(type?: string | null) {
  switch (type) {
    case 'trial_session':
      return 'Trial session'
    case 'single_session':
      return 'Single session'
    case 'four_session_pack':
      return '4-session pack'
    case 'recurring_programme':
      return 'Recurring programme'
    case 'sibling_booking':
      return 'Sibling booking'
    default:
      return 'Single session'
  }
}

export function buildBookingCta(type: string | null | undefined, amount: number) {
  return type === 'trial_session' ? `Book trial ₹${amount.toFixed(0)}` : `Book now ₹${amount.toFixed(0)}`
}

export function deriveDobFromAgeBand(ageBand: AgeBandId) {
  const band = AGE_BANDS.find((item) => item.id === ageBand) ?? AGE_BANDS[1]
  const dob = new Date()
  dob.setFullYear(dob.getFullYear() - band.midpoint)
  return dob.toISOString().split('T')[0]
}

export function getBookingCancellationCopy(date?: string | null) {
  if (!date) return 'Review cancellation and reschedule rules before payment.'

  const sessionDate = new Date(`${date}T18:00:00`)
  if (Number.isNaN(sessionDate.getTime())) {
    return 'Review cancellation and reschedule rules before payment.'
  }

  sessionDate.setDate(sessionDate.getDate() - 1)

  const weekday = sessionDate.toLocaleDateString('en-IN', { weekday: 'short' })
  const day = sessionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `Cancellation until ${weekday} ${day}, 6pm`
}
