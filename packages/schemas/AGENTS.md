# @beam/schemas — Source of Truth

Every data shape used across all 5 apps and the API is defined here.
This package has zero runtime dependencies except `zod`.

## Rule
Define schema here FIRST. Then use it everywhere.
Never define data types inline in app code, services, or components.

## Files
```
src/
  user.schema.ts        User, Parent, Teacher, Child, UserRole
  activity.schema.ts    Activity, Category, ActivityFilters, AgeGroup
  booking.schema.ts     Booking, BookingStatus, CreateBookingInput, BookingFilters
  slot.schema.ts        Slot, SlotInput, SlotWithTeacher, DateRange
  payment.schema.ts     Payment, PaymentStatus, RefundInput, PayoutRecord
  review.schema.ts      Review, FeedbackInput, Rating, ChildUpdate
  notification.schema.ts NotificationTemplate, NotificationLog
  discount.schema.ts    DiscountCode, DiscountType, ApplyDiscountInput
  cart.schema.ts        CartItem, CartSummary, CheckoutInput
  ai.schema.ts          RecommendationInput, RecommendationResult
  index.ts              re-exports everything
```

## Pattern — every schema file follows this exactly
```typescript
import { z } from 'zod'

// 1. Base entity schema (mirrors DB columns)
export const BookingSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  teacherId: z.string().uuid(),
  activityId: z.string().uuid(),
  slotId: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  sessionType: z.enum(['1:1', 'group']),
  totalAmount: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().max(500).nullable(),
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
}).partial()
export type BookingFilters = z.infer<typeof BookingFiltersSchema>

// 4. Update input
export const UpdateBookingStatusSchema = z.object({
  status: BookingSchema.shape.status,
  reason: z.string().optional(),
})
export type UpdateBookingStatus = z.infer<typeof UpdateBookingStatusSchema>
```

## UserRole (used everywhere — get this right)
```typescript
export const UserRoleSchema = z.enum(['parent', 'teacher', 'admin', 'super_admin'])
export type UserRole = z.infer<typeof UserRoleSchema>
```

## DO NOT
- Import from deep paths — always `import { X } from '@beam/schemas'`
- Use `z.any()` or `z.unknown()` as a shortcut
- Put response envelope types here (those live in @beam/api-client)
- Duplicate a schema in app code because "it's slightly different" — extend instead
