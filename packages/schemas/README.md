# @beam/schemas

Source of truth for every data shape used across all five apps and the API. Zero runtime dependencies except `zod`.

## Rule

Define schemas here **first**, then use them everywhere. Never define data types inline in app code, services, or components.

## What it exports

| File | Key exports |
|---|---|
| `user.schema.ts` | `User`, `Parent`, `Teacher`, `Child`, `UserRole`, `UserRoleSchema` |
| `activity.schema.ts` | `Activity`, `Category`, `ActivityFilters`, `AgeGroup` |
| `booking.schema.ts` | `Booking`, `BookingStatus`, `CreateBookingInput`, `BookingFilters` |
| `slot.schema.ts` | `Slot`, `SlotInput`, `SlotWithTeacher`, `DateRange` |
| `payment.schema.ts` | `Payment`, `PaymentStatus`, `RefundInput`, `PayoutRecord` |
| `review.schema.ts` | `Review`, `FeedbackInput`, `Rating`, `ChildUpdate` |
| `notification.schema.ts` | `NotificationTemplate`, `NotificationLog` |
| `discount.schema.ts` | `DiscountCode`, `DiscountType`, `ApplyDiscountInput` |
| `cart.schema.ts` | `CartItem`, `CartSummary`, `CheckoutInput` |
| `ai.schema.ts` | `RecommendationInput`, `RecommendationResult` |

## Usage

```typescript
import { BookingSchema, type Booking, type CreateBookingInput } from '@beam/schemas'

// Validate at boundaries
const booking = BookingSchema.parse(rawData)

// Use inferred types everywhere
function processBooking(booking: Booking) { ... }
```

Always import from the package root — never from deep paths like `@beam/schemas/src/booking.schema`.

## Pattern

Each schema file exports four shapes: base entity, create input, filter/query, update input. See `CLAUDE.md` in this package for the full pattern.
