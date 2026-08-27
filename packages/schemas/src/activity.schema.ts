import { z } from 'zod'

export const ActivityStatusSchema = z.enum(['draft', 'published', 'archived'])
export type ActivityStatus = z.infer<typeof ActivityStatusSchema>

export const SessionTypeSchema = z.enum(['1:1', 'group'])
export type SessionType = z.infer<typeof SessionTypeSchema>

export const DeliveryModeSchema = z.enum(['at_home', 'online'])
export type DeliveryMode = z.infer<typeof DeliveryModeSchema>

export const VenueTypeSchema = z.enum(['indoor', 'outdoor', 'online', 'at_home'])
export type VenueType = z.infer<typeof VenueTypeSchema>

export const ActivityFormatSchema = z.enum(['trial', 'one_time', 'recurring'])
export type ActivityFormat = z.infer<typeof ActivityFormatSchema>

export const TimeOfDaySchema = z.enum(['morning', 'afternoon', 'evening'])
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  categoryName: z.string().optional(),
  ageGroup: z.string().min(1),
  sessionType: SessionTypeSchema,
  deliveryMode: DeliveryModeSchema.default('at_home'),
  venueType: VenueTypeSchema.default('at_home'),
  activityFormat: ActivityFormatSchema.default('one_time'),
  trialAvailable: z.boolean().default(false),
  minChildren: z.number().int().min(1).default(1),
  maxChildren: z.number().int().min(1).default(1),
  sessionDurationMins: z.number().int().positive(),
  pricePerSession: z.number().positive(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  materialsNeeded: z.string().nullable().optional(),
  preparationNotes: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  parentValue: z.string().nullable().optional(),
  sessionFlow: z.string().nullable().optional(),
  parentWaitingPolicy: z.string().nullable().optional(),
  accessibilityNotes: z.string().nullable().optional(),
  whatToBring: z.string().nullable().optional(),
  cancellationPolicy: z.string().nullable().optional(),
  status: ActivityStatusSchema,
  totalBookings: z.number().int().min(0).default(0),
  avgRating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  teacherCount: z.number().int().min(0).default(0),
  distanceKm: z.number().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Activity = z.infer<typeof ActivitySchema>

export const CreateActivityInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  ageGroup: z.string().min(1),
  sessionType: SessionTypeSchema,
  deliveryMode: DeliveryModeSchema.optional(),
  venueType: VenueTypeSchema.optional(),
  activityFormat: ActivityFormatSchema.optional(),
  trialAvailable: z.boolean().optional(),
  minChildren: z.number().int().min(1).optional(),
  maxChildren: z.number().int().min(1).optional(),
  sessionDurationMins: z.number().int().positive(),
  pricePerSession: z.number().positive(),
  imageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  materialsNeeded: z.string().optional(),
  preparationNotes: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  parentValue: z.string().optional(),
  sessionFlow: z.string().optional(),
  parentWaitingPolicy: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  whatToBring: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  status: ActivityStatusSchema.default('draft'),
})
export type CreateActivityInput = z.infer<typeof CreateActivityInputSchema>

export const UpdateActivityInputSchema = CreateActivityInputSchema.partial()
export type UpdateActivityInput = z.infer<typeof UpdateActivityInputSchema>

export const ActivityFiltersSchema = z.object({
  status: ActivityStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  ageGroup: z.string().optional(),
  search: z.string().optional(),
  activityFormat: ActivityFormatSchema.optional(),
  venueType: VenueTypeSchema.optional(),
  trialAvailable: z.coerce.boolean().optional(),
  timeOfDay: TimeOfDaySchema.optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).partial()
export type ActivityFilters = z.infer<typeof ActivityFiltersSchema>

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string(),
  icon: z.string().nullable().optional(),
  createdAt: z.date(),
})
export type Category = z.infer<typeof CategorySchema>
