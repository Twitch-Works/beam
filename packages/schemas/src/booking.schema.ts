import { z } from 'zod'

export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
export type BookingStatus = z.infer<typeof BookingStatusSchema>

// 1. Base entity schema (mirrors DB columns)
export const BookingSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  teacherId: z.string().uuid(),
  activityId: z.string().uuid(),
  slotId: z.string().uuid(),
  status: BookingStatusSchema,
  sessionType: z.enum(['1:1', 'group']),
  totalAmount: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().max(500).nullable().optional(),
  confirmedAt: z.date().nullable().optional(),
  teacherOtp: z.string().length(6).nullable().optional(),
  teacherOtpGeneratedAt: z.date().nullable().optional(),
  teacherOtpVerifiedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  parentCompletedAt: z.date().nullable().optional(),
  payoutQueuedAt: z.date().nullable().optional(),
  payoutReleasedAt: z.date().nullable().optional(),
  lastWhatsAppSentAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Booking = z.infer<typeof BookingSchema>

// 2. Create input (what client sends)
export const CreateBookingInputSchema = z.object({
  childId: z.string().uuid(),
  activityId: z.string().uuid(),
  slotId: z.string().uuid(),
  sessionType: BookingSchema.shape.sessionType,
  discountCode: z.string().optional(),
  addonIds: z.array(z.string().uuid()).default([]),
})
export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>

// 3. Filter/query schema (for list endpoints)
export const BookingFiltersSchema = z.object({
  status: BookingSchema.shape.status.optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  childId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
}).partial()
export type BookingFilters = z.infer<typeof BookingFiltersSchema>

// 4. Update input
export const UpdateBookingStatusSchema = z.object({
  status: BookingSchema.shape.status,
  reason: z.string().optional(),
})
export type UpdateBookingStatus = z.infer<typeof UpdateBookingStatusSchema>

export const RescheduleBookingInputSchema = z.object({
  bookingId: z.string().uuid(),
  parentId: z.string().uuid(),
  newSlotId: z.string().uuid(),
})
export type RescheduleBookingInput = z.infer<typeof RescheduleBookingInputSchema>

export const VerifyBookingOtpInputSchema = z.object({
  bookingId: z.string().uuid(),
  parentId: z.string().uuid(),
  otp: z.string().length(6),
})
export type VerifyBookingOtpInput = z.infer<typeof VerifyBookingOtpInputSchema>
