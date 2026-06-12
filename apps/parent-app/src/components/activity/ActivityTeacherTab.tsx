import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { Skeleton } from '@/components/Skeleton'
import { Avatar } from '@/components/Avatar'

interface Teacher {
  id: string
  firstName: string
  lastName?: string | null
  totalSessions: number
  specializations: string[]
  bio?: string | null
}

interface ActivityTeacherTabProps {
  teacher?: Teacher | null
  teacherLoading: boolean
}

export function ActivityTeacherTab({ teacher, teacherLoading }: ActivityTeacherTabProps) {
  if (teacherLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonCard}>
          <Skeleton width={56} height={56} radius={radius.avatar} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
        <Skeleton width="100%" height={14} />
        <Skeleton width="85%" height={14} />
      </View>
    )
  }

  if (!teacher) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-outline" size={40} color={colors.border} />
        <Text style={styles.emptyText}>No teacher assigned yet</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.teacherProfile}>
        <Avatar firstName={teacher.firstName} lastName={teacher.lastName ?? undefined} size={56} colorIndex={0} />
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{teacher.firstName} {teacher.lastName ?? ''}</Text>
          <Text style={styles.teacherSessions}>{teacher.totalSessions} sessions completed</Text>
          {teacher.specializations.length > 0 && (
            <Text style={styles.teacherSpec}>{teacher.specializations.slice(0, 2).join(' · ')}</Text>
          )}
        </View>
      </View>
      {teacher.bio ? <Text style={styles.teacherBio}>{teacher.bio}</Text> : null}
      <TouchableOpacity
        style={styles.viewProfileBtn}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push(`/(root)/teacher/${teacher.id}`)
        }}
      >
        <Text style={styles.viewProfileText}>View Full Profile</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  skeletonCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  teacherProfile: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  teacherInfo: { flex: 1 },
  teacherName: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  teacherSessions: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    marginTop: 2,
  },
  teacherSpec: { fontSize: fontSize.body, color: colors.gray, fontFamily: 'Nunito-Regular' },
  teacherBio: {
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    lineHeight: 24,
  },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  viewProfileText: { fontSize: fontSize.body, color: colors.primary, fontFamily: 'Nunito-Bold' },
})
