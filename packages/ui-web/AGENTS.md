# @beam/ui-web — Web Component Library

Shared React components used by parent-web, teacher-web, and admin.
Built with React + CSS Modules. Do not introduce Tailwind — keep styling consistent across the package.
Same component API as @beam/ui-native where possible (same prop names, same variants).

## Component hierarchy mirrors ui-native
```
components/
  atoms/       Button, Input, Badge, Avatar, Tag, Spinner, Divider, Icon
  molecules/   ClassCard, BookingCard, TeacherCard, StarRating, SlotPicker,
               ChildChip, CategoryPill, NotificationItem
  organisms/   ActivityGrid, BookingTable, ChildProfileCard, FeedbackForm,
               DataTable (admin), ChartCard (admin)
  templates/   PageLayout, SidebarLayout (admin), AuthLayout, ModalOverlay
```

## Design tokens (from @beam/ui-tokens)
```typescript
import { colors, spacing, typography, radius } from '@beam/ui-tokens'
// Tokens are also available as CSS variables via the theme provider:
// var(--color-primary), var(--spacing-md), etc.
```

## Parity rule
When a component exists in both ui-native and ui-web:
- Same component name
- Same prop names and types
- Same variants (primary/secondary/ghost, etc.)
- Different implementation (RN StyleSheet vs CSS)

This means `@beam/hooks` can be used identically across mobile and web
without caring which UI library renders the result.

## Admin-only components
Some components are admin-exclusive (live in ui-web, not ui-native):
- `DataTable` — TanStack Table wrapper with sort, filter, pagination
- `ChartCard` — Recharts wrapper with title + time range selector
- `StatCard` — KPI metric card (number + delta + label)
- `StatusBadge` — booking/payment status with colors
- `BulkActionBar` — floating bar that appears when rows are selected

## Adding new components
1. Add to correct atoms/molecules/organisms folder
2. Export from `components/index.ts`
3. Export from package `index.ts`
4. If it should also exist in ui-native, create the RN version there too
