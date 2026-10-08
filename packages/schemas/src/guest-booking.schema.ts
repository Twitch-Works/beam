import { z } from 'zod'

// Booking from the public landing page — no login. The parent is matched to an
// existing account by mobile number (or created), so the booking shows up when
// they later sign in to the mobile app with the same number.

// Indian mobile: 10 digits starting 6–9 (optionally typed with +91 / 0 / spaces)
export const IndianMobileSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'))

// 2. Create input (what the landing page sends)
export const CreateGuestBookingInputSchema = z.object({
  activityId: z.string().uuid(),
  slotId: z.string().uuid(),
  parentName: z.string().trim().min(2, 'Enter your name').max(80),
  phone: IndianMobileSchema,
  childName: z.string().trim().min(1, "Enter your child's name").max(60),
  childAge: z.coerce.number().int().min(1, 'Age must be 1–16').max(16, 'Age must be 1–16'),
})
export type CreateGuestBookingInput = z.infer<typeof CreateGuestBookingInputSchema>

export const VerifyGuestPaymentInputSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})
export type VerifyGuestPaymentInput = z.infer<typeof VerifyGuestPaymentInputSchema>

// Response — deliberately carries no parent/child ids (anonymous caller)
export const GuestBookingSummarySchema = z.object({
  bookingId: z.string().uuid(),
  activityTitle: z.string(),
  scheduledAt: z.string(),
  amount: z.number(),
  paymentStatus: z.enum(['pending', 'success', 'failed', 'refunded']),
})
export type GuestBookingSummary = z.infer<typeof GuestBookingSummarySchema>
