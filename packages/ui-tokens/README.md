# @beam/ui-tokens

Raw design token values shared by `@beam/ui-native` and `@beam/ui-web`. Single source of truth for the Beam design system.

## Usage

```typescript
import { colors, spacing, typography, radius, shadows } from '@beam/ui-tokens'

// Mobile (React Native)
style={{ color: colors.primary, padding: spacing.md, borderRadius: radius.card }}

// Web — tokens are also exposed as CSS custom properties
// var(--color-primary) → #1787A6
// var(--spacing-md)    → 16px
// var(--radius-card)   → 16px
```

## What it exports

| Export | Key values |
|---|---|
| `colors` | `primary` (#1787A6 teal), `coral`, `yellow`, `navy`, `mint`, `lavender`, `white`, `gray.*`, `status.*` |
| `spacing` | `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `2xl` (48px), `3xl` (64px) |
| `fontSize`, `fontWeight`, `fontFamily` | Nunito Rounded scale: display (36px) → micro (11px) |
| `radius` | `tag` (4px), `input` (8px), `button` (12px), `card` (16px), `modal` (24px), `avatar` (50%) |
| `shadows` | `card`, `modal`, `button`, `tabBar` |

## Rules

Never hardcode colors, spacing, font sizes, or border radii anywhere in app or package code. Always import from here.

```typescript
// ❌ Wrong
style={{ color: '#1787A6', padding: 16 }}

// ✅ Correct
style={{ color: colors.primary, padding: spacing.md }}
```
