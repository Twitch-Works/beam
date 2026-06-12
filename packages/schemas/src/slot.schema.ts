import { z } from 'zod'

export const SlotSchema = z.object({
  id: z.string().uuid(),
  teacherId: z.string().uuid(),
  activityId: z.string().uuid(),
  date: z.string().date(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean().default(true),
  lockedByBookingId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
})
export type Slot = z.infer<typeof SlotSchema>

export const SlotInputSchema = z.object({
  teacherId: z.string().uuid(),
  activityId: z.string().uuid(),
  date: z.string().date(),
  startTime: z.string(),
  endTime: z.string(),
})
export type SlotInput = z.infer<typeof SlotInputSchema>

export const SlotWithTeacherSchema = SlotSchema.extend({
  teacherName: z.string(),
  teacherAvatarUrl: z.string().url().nullable().optional(),
  activityTitle: z.string(),
  pricePerSession: z.number().positive(),
})
export type SlotWithTeacher = z.infer<typeof SlotWithTeacherSchema>

export const DateRangeSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
})
export type DateRange = z.infer<typeof DateRangeSchema>
