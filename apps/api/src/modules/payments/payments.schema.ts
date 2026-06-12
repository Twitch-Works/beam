import { z } from 'zod'

export const CreateOrderInputSchema = z.object({
  bookingId: z.string().uuid(),
})

export const VerifyPaymentInputSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId:   z.string().min(1),
  razorpaySignature: z.string().min(1),
})
