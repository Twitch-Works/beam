import { z } from 'zod'

// ── Weekly availability (teacher preference, stored on teachers.availability_json) ──

export const WeekdaySchema = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
export type Weekday = z.infer<typeof WeekdaySchema>

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

// "HH:MM-HH:MM", end strictly after start
export const TimeRangeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Use HH:MM-HH:MM')
  .refine((v) => {
    const [start, end] = v.split('-')
    return HHMM.test(start) && HHMM.test(end) && start < end
  }, 'End time must be after start time')

export const WeeklyAvailabilitySchema = z.record(WeekdaySchema, z.array(TimeRangeSchema).max(6))
export type WeeklyAvailability = z.infer<typeof WeeklyAvailabilitySchema>

export const UpdateAvailabilityInputSchema = z.object({
  availability: WeeklyAvailabilitySchema,
})
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilityInputSchema>

// ── Teacher-managed class slots ──

export const ClockTimeSchema = z.string().regex(HHMM, 'Use HH:MM')

export const TeacherSlotInputSchema = z
  .object({
    activityId: z.string().uuid(),
    date: z.string().date(),
    startTime: ClockTimeSchema,
    endTime: ClockTimeSchema,
  })
  .refine((v) => v.startTime < v.endTime, { message: 'End time must be after start time', path: ['endTime'] })
export type TeacherSlotInput = z.infer<typeof TeacherSlotInputSchema>

export const TeacherSlotFiltersSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  activityId: z.string().uuid().optional(),
})
export type TeacherSlotFilters = z.infer<typeof TeacherSlotFiltersSchema>

// ── Booking change requests (teacher asks, admin approves) ──

export const BookingChangeRequestTypeSchema = z.enum(['reschedule', 'cancel'])
export type BookingChangeRequestType = z.infer<typeof BookingChangeRequestTypeSchema>

export const BookingChangeRequestStatusSchema = z.enum(['pending', 'approved', 'rejected', 'withdrawn'])
export type BookingChangeRequestStatus = z.infer<typeof BookingChangeRequestStatusSchema>

// 1. Base entity (mirrors DB columns)
export const BookingChangeRequestSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  teacherId: z.string().uuid(),
  type: BookingChangeRequestTypeSchema,
  status: BookingChangeRequestStatusSchema,
  reason: z.string(),
  proposedSlotId: z.string().uuid().nullable(),
  adminNote: z.string().nullable(),
  reviewedBy: z.string().uuid().nullable(),
  reviewedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type BookingChangeRequest = z.infer<typeof BookingChangeRequestSchema>

// 2. Create input (teacher)
const ReasonSchema = z.string().trim().min(5, 'Please give a short reason').max(500)

export const CreateBookingChangeRequestInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('reschedule'), proposedSlotId: z.string().uuid(), reason: ReasonSchema }),
  z.object({ type: z.literal('cancel'), reason: ReasonSchema }),
])
export type CreateBookingChangeRequestInput = z.infer<typeof CreateBookingChangeRequestInputSchema>

// 3. Filters
export const BookingChangeRequestFiltersSchema = z.object({
  status: BookingChangeRequestStatusSchema.optional(),
})
export type BookingChangeRequestFilters = z.infer<typeof BookingChangeRequestFiltersSchema>

// 4. Review input (admin)
export const ReviewBookingChangeRequestInputSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().trim().max(500).optional(),
})
export type ReviewBookingChangeRequestInput = z.infer<typeof ReviewBookingChangeRequestInputSchema>
