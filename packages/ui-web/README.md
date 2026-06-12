# @beam/ui-web

Shared React component library used by `parent-web`, `teacher-web`, and `admin`. Built with React and CSS Modules. API mirrors `@beam/ui-native` — same component names and prop shapes wherever possible.

## Usage

```typescript
import { Button, Badge, ClassCard, DataTable } from '@beam/ui-web'
```

## Component hierarchy

**Atoms** — `Button`, `Input`, `Badge`, `Avatar`, `Tag`, `Spinner`, `Divider`, `Icon`

**Molecules** — `ClassCard`, `BookingCard`, `TeacherCard`, `StarRating`, `SlotPicker`, `ChildChip`, `CategoryPill`, `NotificationItem`

**Organisms** — `ActivityGrid`, `BookingTable`, `ChildProfileCard`, `FeedbackForm`, `DataTable` *(admin)*, `ChartCard` *(admin)*

**Templates** — `PageLayout`, `SidebarLayout` *(admin)*, `AuthLayout`, `ModalOverlay`

## Admin-only components

| Component | Description |
|---|---|
| `DataTable` | TanStack Table v8 wrapper with sort, filter, pagination |
| `ChartCard` | Recharts wrapper with title + time range selector |
| `StatCard` | KPI metric card (number + delta + label) |
| `StatusBadge` | Booking/payment status with semantic colors |
| `BulkActionBar` | Floating bar that appears when table rows are selected |

## Design tokens

```typescript
import { colors, spacing, radius } from '@beam/ui-tokens'
// Tokens are also exposed as CSS custom properties: var(--color-primary), var(--spacing-md)
```

## Notes

- Do not use Tailwind inside this package — keeps styling consistent with CSS Modules.
- Same component name + props as `@beam/ui-native` so `@beam/hooks` works across both platforms.
- `SessionCalendar` wraps `react-big-calendar` — always import via this component, never directly.
