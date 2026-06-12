# @beam/api-client

Type-safe Axios HTTP client for all Beam apps. Provides a single `api` object with namespaced methods typed from `@beam/schemas`.

> **Status:** Planned architecture. Source files are not yet scaffolded — create `src/` before building features that depend on this package.

## Usage

```typescript
import { api } from '@beam/api-client'

// Activities
await api.catalog.list({ category: 'Music', limit: 20 })
await api.catalog.get(activityId)

// Bookings
await api.bookings.create({ parentId, childId, activityId, slotId, totalAmount })
await api.bookings.list({ status: 'confirmed' })
await api.bookings.cancel(bookingId)

// Payments
await api.payments.createIntent(bookingId)
await api.payments.confirm(bookingId, { razorpayPaymentId, razorpayOrderId, razorpaySignature })

// Users
await api.users.getProfile()
await api.users.getChildren()
```

## What it exports

| Namespace | Methods |
|---|---|
| `api.bookings` | `create`, `get`, `list`, `cancel`, `feedback`, `rebook` |
| `api.catalog` | `list`, `get`, `search`, `getRecommendations` |
| `api.scheduling` | `getSlots`, `lockSlot`, `releaseSlot` |
| `api.payments` | `createIntent`, `confirm`, `refund` |
| `api.users` | `getProfile`, `updateProfile`, `getChildren`, `updateChild` |
| `api.admin` | All admin-only endpoints (assign, bulk actions, analytics) |

## Notes

- The Axios instance automatically attaches the auth JWT from storage on every request.
- 401 responses trigger a silent token refresh before retrying once.
- Never import `@beam/api-client` directly in screen files — use hooks from `@beam/hooks` instead.
