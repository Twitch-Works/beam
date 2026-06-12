import { z } from 'zod'

export const UserRoleSchema = z.enum(['parent', 'teacher', 'admin', 'super_admin'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type User = z.infer<typeof UserSchema>

export const ParentSchema = UserSchema.extend({
  role: z.literal('parent'),
  phone: z.string().nullable().optional(),
})
export type Parent = z.infer<typeof ParentSchema>

export const TeacherSchema = UserSchema.extend({
  role: z.literal('teacher'),
  bio: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
})
export type Teacher = z.infer<typeof TeacherSchema>

export const ChildSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1).nullable().optional(),
  dateOfBirth: z.string().date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Child = z.infer<typeof ChildSchema>

export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRoleSchema,
  phone: z.string().optional(),
})
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>

export const UserFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
})
export type UserFilters = z.infer<typeof UserFiltersSchema>
