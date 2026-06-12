# ADR 002 — Calendar Component (react-big-calendar)

**Date:** 2026-05  
**Status:** Accepted  
**Deciders:** Beam team

---

## Context

Two apps need a session calendar view:

- **`apps/teacher-web`** — Teachers view their assigned sessions in a week/month calendar
- **`apps/admin`** — Ops team views all sessions across all teachers with conflict highlighting

Both were independently documented to use `react-big-calendar`, risking two different wrapper implementations diverging over time.

---

## Decision

`react-big-calendar` is the shared calendar library. A **single shared wrapper** lives in `@beam/ui-web`:

```
packages/ui-web/components/organisms/SessionCalendar.tsx
```

### SessionCalendar props
```typescript
type SessionCalendarProps = {
  sessions: CalendarSession[]   // from @beam/schemas
  view?: 'week' | 'month'       // default: 'week'
  onSessionClick?: (session: CalendarSession) => void
  // admin-only props:
  highlightConflicts?: boolean
  teacherFilter?: string
}
```

### Color coding (consistent between teacher-web and admin)
| State | Color |
|---|---|
| Accepted / Upcoming | Teal (`#1787A6`) |
| Pending | Amber (`#FEF3C7` bg, `#92400E` text) |
| Completed | Light gray |
| Conflict (admin only) | Coral (`#FF7A59`) |

---

## Alternatives Considered

| Option | Reason Rejected |
|---|---|
| Two separate calendar implementations | Would diverge in color coding and behavior; violates DRY |
| FullCalendar | Larger bundle; licensing cost for premium features |
| Custom grid from scratch | Not worth the effort at current scale |

---

## Consequences

- **Good:** Single source of truth for session calendar UX across teacher-web and admin
- **Good:** Color semantics stay consistent — teachers and admins see the same status colors
- **Action required:** When adding calendar features, edit `SessionCalendar.tsx` in `@beam/ui-web`, not local copies in each app

---

## Implementation References

- `packages/ui-web/components/organisms/SessionCalendar.tsx` — shared wrapper
- `apps/teacher-web/src/app/(main)/sessions/page.tsx` — teacher usage
- `apps/admin/src/app/(dashboard)/schedule/page.tsx` — admin usage
