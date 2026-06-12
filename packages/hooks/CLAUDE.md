# @beam/hooks — Shared TanStack Query Hooks

Query hooks grouped by role. Used identically across mobile and web for the same role.
All hooks use `@beam/api-client` internally — never raw fetch/axios.

## Structure
```
src/
  parent/
    useActivities.ts      list + filter activities
    useActivity.ts        single activity detail
    useSlots.ts           available slots for an activity + date
    useBookings.ts        parent's bookings (upcoming + past)
    useBooking.ts         single booking detail
    useCart.ts            cart state mutations
    useChildren.ts        parent's children list
    useChild.ts           single child profile
    useRecommendations.ts AI-powered next class suggestions
    usePayment.ts         create payment intent, confirm
    useFeedback.ts        submit post-session feedback
    index.ts

  teacher/
    useAssignedSessions.ts  teacher's upcoming sessions
    useSession.ts           single session detail + child info
    useSessionActions.ts    accept, decline, start, complete mutations
    useEarnings.ts          payout history + upcoming estimate
    useChecklist.ts         session checklist state
    index.ts

  admin/
    useAllBookings.ts       paginated booking list with filters
    useBookingDetail.ts     full booking detail for admin
    useTeachers.ts          teacher list + status
    useTeacher.ts           teacher detail + sessions
    useAssignTeacher.ts     assignment mutation
    useAnalytics.ts         revenue + engagement data
    usePayments.ts          payment ledger
    usePayouts.ts           payout queue
    useDiscounts.ts         discount code management
    index.ts

  shared/
    useNotifications.ts     in-app notification list
    useProfile.ts           current user's profile
    index.ts
```

## Hook pattern (every hook follows this)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@beam/api-client'
import type { BookingFilters, Booking } from '@beam/schemas'

// Query keys as constants — prevents string typos
export const bookingKeys = {
  all: ['bookings'] as const,
  list: (filters: BookingFilters) => ['bookings', 'list', filters] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
}

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => api.bookings.list(filters),
    staleTime: 30_000,      // 30s — bookings change moderately
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.bookings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
  })
}
```

## Import paths
```typescript
// In parent-app or parent-web:
import { useBookings, useActivities } from '@beam/hooks/parent'

// In teacher-app or teacher-web:
import { useAssignedSessions } from '@beam/hooks/teacher'

// In admin:
import { useAllBookings } from '@beam/hooks/admin'

// Shared (any app):
import { useProfile } from '@beam/hooks/shared'
```

## Stale times
```
activities list   5 min   (changes infrequently)
slots             30 sec  (high churn during booking)
bookings          30 sec  (status changes frequently)
child profile     2 min
teacher earnings  5 min
analytics         10 min
```
