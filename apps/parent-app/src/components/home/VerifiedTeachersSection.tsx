import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { Avatar } from '@/components/Avatar'
import { Skeleton } from '@/components/Skeleton'
import { useTeachers } from '@/hooks/useTeacher'

export const VerifiedTeachersSection = React.memo(function VerifiedTeachersSection() {
  const { data, isLoading } = useTeachers(4)
  const teachers = data?.items ?? []

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[0, 1].map((index) => (
          <View key={index} style={styles.row}>
            <Skeleton width={50} height={50} radius={radius.avatar} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="70%" height={12} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={72} height={38} radius={radius.button} />
          </View>
        ))}
      </View>
    )
  }

  if (teachers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="school-outline" size={28} color={colors.border} />
        <Text style={styles.emptyText}>Verified teacher profiles will appear here soon.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {teachers.map((teacher, index) => (
        <TeacherRow key={teacher.id} teacher={teacher} colorIndex={index % 4} />
      ))}
    </View>
  )
})

function TeacherRow({
  teacher,
  colorIndex,
}: {
  teacher: {
    id: string
    firstName: string
    lastName: string | null
    specializations: string[]
    rating: string
    reviewCount: number
    totalSessions: number
  }
  colorIndex: number
}) {
  const handleBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/(root)/teacher/${teacher.id}`)
  }

  const primarySpecialization = teacher.specializations[0] ?? 'Verified teacher'
  const rating = Number.parseFloat(teacher.rating || '0')

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <Avatar
          firstName={teacher.firstName}
          lastName={teacher.lastName ?? undefined}
          size={50}
          colorIndex={colorIndex}
        />
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{teacher.firstName} {teacher.lastName}</Text>
        <Text style={styles.specialty}>{primarySpecialization} · Verified by Beam</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={colors.yellow} />
          <Text style={styles.rating}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
          <Text style={styles.sessions}>{teacher.totalSessions} sessions</Text>
          {teacher.reviewCount > 0 ? (
            <Text style={styles.sessions}>{teacher.reviewCount} reviews</Text>
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.85}>
        <Text style={styles.bookText}>Book</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  emptyState: {
    marginHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  emptyText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  avatarWrap: { position: 'relative' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  specialty: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  sessions: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    marginLeft: 4,
  },
  bookBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  bookText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
})
