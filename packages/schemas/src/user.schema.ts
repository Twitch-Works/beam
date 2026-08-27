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
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})
export type Parent = z.infer<typeof ParentSchema>

export const TeacherSchema = UserSchema.extend({
  role: z.literal('teacher'),
  bio: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  specializations: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
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
  gender: z.string().nullable().optional(),
  interests: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
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
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>

export const RegisterParentInputSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})
export type RegisterParentInput = z.infer<typeof RegisterParentInputSchema>

export const CreateChildInputSchema = z.object({
  parentId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  dateOfBirth: z.string().date(),
  gender: z.string().optional(),
  interests: z.array(z.string()).default([]),
  notes: z.string().optional(),
})
export type CreateChildInput = z.infer<typeof CreateChildInputSchema>

export const UpdateChildInputSchema = z.object({
  parentId: z.string().uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.string().optional(),
  interests: z.array(z.string()).optional(),
  notes: z.string().optional(),
})
export type UpdateChildInput = z.infer<typeof UpdateChildInputSchema>

export const UserFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
})
export type UserFilters = z.infer<typeof UserFiltersSchema>
