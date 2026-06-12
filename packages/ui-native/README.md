# @beam/ui-native

Shared React Native component library used by `parent-app` and `teacher-app`. Built with React Native StyleSheet and Expo. No web-specific APIs.

## Usage

```typescript
import { Button, Badge, ClassCard, BookingCard, SlotPicker } from '@beam/ui-native'
```

## Component hierarchy

**Atoms** — `Button`, `Input`, `Badge`, `Avatar`, `Tag`, `Spinner`, `Divider`, `Icon`

**Molecules** — `ClassCard`, `BookingCard`, `TeacherCard`, `StarRating`, `SlotPicker`, `ChildChip`, `CategoryPill`, `NotificationItem`, `SOSButton`

**Organisms** — `ActivityGrid`, `BookingTimeline`, `ChildProfileCard`, `ChecklistGroup`, `FeedbackForm`

**Templates** — `ScreenLayout`, `TabBarLayout`, `ModalLayout`

## Component contract

Every component accepts `style` (StyleProp) and `testID` props. List-item components are wrapped in `React.memo`. Design tokens always come from `@beam/ui-tokens` — no hardcoded values.

## Design tokens

```typescript
import { colors, spacing, radius, shadows } from '@beam/ui-tokens'

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.card, ...shadows.card }
})
```

## Notes

- Use `@shopify/flash-list` (`ActivityGrid`) not `FlatList` for any list that may grow.
- Use `expo-image` not RN `<Image>` for all image rendering.
- Call `expo-haptics` on every primary button press.
