import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, ErrorState, LoadingState } from '../../src/components/StateViews'
import { Screen } from '../../src/components/Screen'
import { StatusBadge } from '../../src/components/StatusBadge'
import { useTeacherChecklist } from '../../src/hooks/useTeacherChecklist'
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../../src/constants/theme'

export default function ChecklistScreen() {
  const { data, isError, isLoading, refetch, toggleItem } = useTeacherChecklist()

  if (isLoading) return <LoadingState message="Loading checklist" />
  if (isError || !data) return <ErrorState message="Couldn't load checklist" onRetry={refetch} />

  if (!data.groups.length) {
    return (
      <Screen>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Checklist</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={18} color={colors.primary} />
          </View>
        </View>
        <EmptyState message="No upcoming prep items" cta="Review sessions" />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Checklist</Text>
        <View style={styles.iconBtn}>
          <Ionicons name="filter-outline" size={18} color={colors.primary} />
        </View>
      </View>

      {data.groups.map((group) => {
        const total = group.items.length
        const done = group.items.filter((i) => i.completed).length
        const progress = total > 0 ? done / total : 0

        return (
          <View key={group.sessionId} style={styles.groupCard}>
            {/* Session header */}
            <View style={styles.groupHeader}>
              <View style={styles.groupMeta}>
                <Text style={styles.childName}>{group.childName}</Text>
                <Text style={styles.timeRange}>{group.timeRange}</Text>
              </View>
              <View style={styles.groupRight}>
                <StatusBadge status="confirmed" />
                <Text style={styles.progressFraction}>
                  {done} of {total} done
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* Checklist items */}
            <View style={styles.items}>
              {group.items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}
                  onPress={() => toggleItem(item.id)}
                  style={styles.item}
                >
                  <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
                    {item.completed && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={[styles.itemTitle, item.completed && styles.itemDone]}>
                      {item.title}
                    </Text>
                    {item.required && (
                      <Text style={styles.required}>Required</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pageTitle: {
    color: colors.navy,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  groupMeta: {
    flex: 1,
    gap: 2,
  },
  childName: {
    color: colors.navy,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  timeRange: {
    color: colors.gray,
    fontSize: fontSize.caption,
  },
  groupRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  progressFraction: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lightGray,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  items: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: colors.navy,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  itemDone: {
    color: colors.gray,
    textDecorationLine: 'line-through',
  },
  required: {
    color: colors.coral,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
})
