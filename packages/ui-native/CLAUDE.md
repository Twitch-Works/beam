# @beam/ui-native — Mobile Component Library

Shared React Native components used by parent-app and teacher-app.
Built with React Native + StyleSheet. No web-specific APIs.

## Component hierarchy
```
components/
  atoms/
    Button.tsx          primary, secondary, ghost, danger variants
    Input.tsx           text, phone, OTP variants
    Badge.tsx           status badges (upcoming, confirmed, completed, cancelled)
    Avatar.tsx          circular image with fallback initials
    Tag.tsx             category/skill pill
    Spinner.tsx         loading indicator
    Divider.tsx
    Icon.tsx            wraps @expo/vector-icons/Ionicons

  molecules/
    ClassCard.tsx       activity card (image, title, age, price, rating)
    BookingCard.tsx     booking summary (teacher, date, status)
    TeacherCard.tsx     teacher info (photo, name, rating, skills)
    StarRating.tsx      interactive + display-only modes
    SlotPicker.tsx      date + time slot selector
    ChildChip.tsx       child avatar + name selector pill
    CategoryPill.tsx    horizontal scroll category filter
    NotificationItem.tsx
    SOSButton.tsx       red emergency button (always floating when in session)

  organisms/
    ActivityGrid.tsx    FlashList of ClassCards (never FlatList)
    BookingTimeline.tsx vertical list of BookingCards with date separators
    ChildProfileCard.tsx skills radar chart + badges + session count
    ChecklistGroup.tsx  pre-session materials checklist
    FeedbackForm.tsx    post-session rating + notes

  templates/
    ScreenLayout.tsx    SafeAreaView + scroll + header slot
    TabBarLayout.tsx    bottom tab navigator wrapper
    ModalLayout.tsx     bottom sheet modal wrapper
```

## Design tokens (always import from @beam/ui-tokens)
```typescript
import { colors, spacing, typography, radius, shadows } from '@beam/ui-tokens'

// Never hardcode:
// ❌ style={{ color: '#1787A6' }}
// ✅ style={{ color: colors.primary }}
```

## StyleSheet pattern
```typescript
// Always use StyleSheet.create — never inline style objects on components
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
  },
})
```

## Component contract
Every component must:
1. Accept `style` prop for overrides (StyleProp<ViewStyle> or StyleProp<TextStyle>)
2. Accept `testID` prop for E2E testing
3. Be wrapped in `React.memo` if it takes non-primitive props
4. Have JSDoc on the component function describing props

## Adding new components
1. Check if it belongs in atoms/molecules/organisms
2. Create in correct folder
3. Export from `components/index.ts`
4. Export from `package index.ts`
5. Add to Storybook (when set up — `src/stories/`)
