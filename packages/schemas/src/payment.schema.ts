import { z } from 'zod'

export const PaymentStatusSchema = z.enum(['pending', 'success', 'failed', 'refunded'])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

export const PayoutStatusSchema = z.enum(['queued', 'dispatched', 'settled', 'failed'])
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>

export const PaymentGatewaySchema = z.enum(['razorpay', 'upi', 'card', 'netbanking', 'wallet'])
export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  parentId: z.string().uuid(),
  parentName: z.string().optional(),
  activityTitle: z.string().optional(),
  amount: z.number().positive(),
  gateway: PaymentGatewaySchema,
  gatewayPaymentId: z.string().nullable().optional(),
  status: PaymentStatusSchema,
  refundedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Payment = z.infer<typeof PaymentSchema>

export const PayoutSchema = z.object({
  id: z.string().uuid(),
  teacherId: z.string().uuid(),
  teacherName: z.string().optional(),
  amount: z.number().positive(),
  sessionCount: z.number().int().min(0),
  bookingIds: z.array(z.string().uuid()),
  status: PayoutStatusSchema,
  bankAccount: z.string().nullable().optional(),
  scheduledAt: z.date().nullable().optional(),
  settledAt: z.date().nullable().optional(),
  createdAt: z.date(),
})
export type Payout = z.infer<typeof PayoutSchema>

export const RefundInputSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(1),
})
export type RefundInput = z.infer<typeof RefundInputSchema>

export const PayoutRecordSchema = z.object({
  teacherId: z.string().uuid(),
  periodFrom: z.string().date(),
  periodTo: z.string().date(),
  totalEarnings: z.number().min(0),
  platformFee: z.number().min(0),
  netPayout: z.number().min(0),
  sessionCount: z.number().int().min(0),
})
export type PayoutRecord = z.infer<typeof PayoutRecordSchema>
