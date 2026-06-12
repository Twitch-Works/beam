# @beam/hooks

Shared TanStack Query hooks grouped by role. Used identically across mobile (Expo) and web (Next.js) for the same user role.

> **Status:** Planned architecture. Source files are not yet scaffolded — create `src/` before building features that depend on this package. See `CLAUDE.md` in this directory for the full hook pattern to follow.

## Import paths

```typescript
// Parent app / parent-web
import { useBookings, useActivities, useChild } from '@beam/hooks/parent'

// Teacher app / teacher-web
import { useAssignedSessions, useEarnings } from '@beam/hooks/teacher'

// Admin
import { useAllBookings, useTeachers } from '@beam/hooks/admin'

// Any app
import { useProfile, useNotifications } from '@beam/hooks/shared'
```

## What each group exports

**`@beam/hooks/parent`** — `useActivities`, `useActivity`, `useSlots`, `useBookings`, `useBooking`, `useCart`, `useChildren`, `useChild`, `useRecommendations`, `usePayment`, `useFeedback`

**`@beam/hooks/teacher`** — `useAssignedSessions`, `useSession`, `useSessionActions`, `useEarnings`, `useChecklist`

**`@beam/hooks/admin`** — `useAllBookings`, `useBookingDetail`, `useTeachers`, `useTeacher`, `useAssignTeacher`, `useAnalytics`, `usePayments`, `usePayouts`, `useDiscounts`

**`@beam/hooks/shared`** — `useProfile`, `useNotifications`

## Stale times

| Data | Stale after |
|---|---|
| Activities list | 5 min |
| Slots | 30 sec |
| Bookings | 30 sec |
| Child profile | 2 min |
| Teacher earnings | 5 min |
| Analytics | 10 min |

## Notes

All hooks use `@beam/api-client` internally — never call the API client directly in screen files.
