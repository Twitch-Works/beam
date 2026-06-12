import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'

export function TeacherSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.hero}>
        <Skeleton width={88} height={88} radius={radius.avatar} />
        <Skeleton width={160} height={24} />
        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statCell}>
              <Skeleton width={36} height={20} />
              <Skeleton width={48} height={12} />
            </View>
          ))}
        </View>
        <View style={styles.pillsRow}>
          {[64, 52, 40].map((w, i) => (
            <Skeleton key={i} width={w} height={28} radius={radius.avatar} />
          ))}
        </View>
      </View>
      <View style={styles.tabsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.tabCell}>
            <Skeleton width={48} height={14} />
          </View>
        ))}
      </View>
      <View style={styles.cards}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.cardRow}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton width="65%" height={18} />
              <Skeleton width="45%" height={12} />
              <Skeleton width="35%" height={14} />
            </View>
            <Skeleton width={60} height={36} radius={radius.button} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
    gap: spacing.lg,
  },
  statCell: { flex: 1, alignItems: 'center', gap: spacing.xs },
  pillsRow: { flexDirection: 'row', gap: spacing.sm },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabCell: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  cards: { padding: spacing.md, gap: spacing.md },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
})
