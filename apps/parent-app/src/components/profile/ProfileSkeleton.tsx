import React from 'react'
import { View, ScrollView } from 'react-native'
import { colors, spacing, radius, shadows } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'

interface ProfileSkeletonProps {
  bottomInset: number
}

export function ProfileSkeleton({ bottomInset }: ProfileSkeletonProps) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.card, padding: spacing.md, ...shadows.card, gap: spacing.md, alignItems: 'center' }}>
        <Skeleton width={60} height={60} radius={radius.avatar} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="35%" height={12} />
        </View>
        <Skeleton width={36} height={36} radius={radius.avatar} />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.card, ...shadows.card, overflow: 'hidden' }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: colors.border }}>
            <Skeleton width={36} height={20} />
            <Skeleton width={52} height={12} />
          </View>
        ))}
      </View>
      {[4, 3, 4].map((count, si) => (
        <View key={si} style={{ gap: spacing.sm }}>
          <Skeleton width={80} height={12} />
          <View style={{ backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card }}>
            {Array.from({ length: count }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: i < count - 1 ? 1 : 0, borderBottomColor: colors.border, gap: spacing.md }}>
                <Skeleton width={36} height={36} radius={radius.input} />
                <Skeleton width="55%" height={14} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
