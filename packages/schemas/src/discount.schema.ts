import { z } from 'zod'

export const DiscountTypeSchema = z.enum(['flat', 'percent'])
export type DiscountType = z.infer<typeof DiscountTypeSchema>

export const DiscountCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(3).max(20).toUpperCase(),
  type: DiscountTypeSchema,
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  usedCount: z.number().int().min(0).default(0),
  validFrom: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
})
export type DiscountCode = z.infer<typeof DiscountCodeSchema>

export const CreateDiscountInputSchema = z.object({
  code: z.string().min(3).max(20),
  type: DiscountTypeSchema,
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().date().optional(),
  expiresAt: z.string().date().optional(),
  isActive: z.boolean().default(true),
})
export type CreateDiscountInput = z.infer<typeof CreateDiscountInputSchema>

export const ApplyDiscountInputSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().positive(),
})
export type ApplyDiscountInput = z.infer<typeof ApplyDiscountInputSchema>

export const ApplyDiscountResultSchema = z.object({
  valid: z.boolean(),
  discountAmount: z.number().min(0),
  finalAmount: z.number().min(0),
  message: z.string().optional(),
})
export type ApplyDiscountResult = z.infer<typeof ApplyDiscountResultSchema>
