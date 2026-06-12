import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'

export function ExploreSkeleton() {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={90} height={90} radius={radius.card} />
          <View style={styles.body}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="50%" height={12} />
            <View style={styles.badges}>
              <Skeleton width={50} height={18} radius={radius.badge} />
              <Skeleton width={40} height={18} radius={radius.badge} />
            </View>
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  body: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: spacing.sm },
})
