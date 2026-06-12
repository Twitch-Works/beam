import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'

export function PaymentSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.card}>
        <Skeleton width={60} height={12} />
        <View style={styles.row}>
          <Skeleton width={48} height={48} radius={radius.button} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width="65%" height={16} />
            <Skeleton width="50%" height={12} />
            <Skeleton width="45%" height={12} />
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <Skeleton width={80} height={12} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.methodRow}>
            <Skeleton width={44} height={44} radius={radius.button} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="55%" height={12} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Skeleton width={70} height={12} />
        <Skeleton width="100%" height={48} radius={radius.input} />
      </View>
      <View style={styles.card}>
        <Skeleton width={90} height={12} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.priceRow}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="25%" height={14} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
})
