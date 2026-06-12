import { z } from 'zod'

export const RatingSchema = z.number().int().min(1).max(5)
export type Rating = z.infer<typeof RatingSchema>

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  parentId: z.string().uuid(),
  parentName: z.string().optional(),
  teacherId: z.string().uuid(),
  teacherName: z.string().optional(),
  activityId: z.string().uuid(),
  activityTitle: z.string().optional(),
  childName: z.string().optional(),
  rating: RatingSchema,
  comment: z.string().nullable().optional(),
  isFlagged: z.boolean().default(false),
  createdAt: z.date(),
})
export type Review = z.infer<typeof ReviewSchema>

export const FeedbackInputSchema = z.object({
  bookingId: z.string().uuid(),
  rating: RatingSchema,
  comment: z.string().max(1000).optional(),
  childUpdate: z.string().max(500).optional(),
})
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>

export const ChildUpdateSchema = z.object({
  bookingId: z.string().uuid(),
  childId: z.string().uuid(),
  skillsLearned: z.array(z.string()),
  teacherNote: z.string().max(500).optional(),
  nextSteps: z.string().max(500).optional(),
})
export type ChildUpdate = z.infer<typeof ChildUpdateSchema>
