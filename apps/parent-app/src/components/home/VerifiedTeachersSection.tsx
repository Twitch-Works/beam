import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { Avatar } from '@/components/Avatar'

const MOCK_TEACHERS = [
  {
    id: '1',
    firstName: 'Priya',
    lastName: 'Menon',
    specialty: 'Art & Craft',
    yearsExp: 6,
    rating: 4.9,
    sessions: 340,
    colorIndex: 0,
  },
  {
    id: '2',
    firstName: 'Rahul',
    lastName: 'Sharma',
    specialty: 'Music & Drums',
    yearsExp: 8,
    rating: 4.8,
    sessions: 290,
    colorIndex: 2,
  },
]

export const VerifiedTeachersSection = React.memo(function VerifiedTeachersSection() {
  return (
    <View style={styles.container}>
      {MOCK_TEACHERS.map((teacher) => (
        <TeacherRow key={teacher.id} teacher={teacher} />
      ))}
    </View>
  )
})

function TeacherRow({ teacher }: { teacher: (typeof MOCK_TEACHERS)[0] }) {
  const handleBook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/(root)/teacher/${teacher.id}`)
  }

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <Avatar
          firstName={teacher.firstName}
          lastName={teacher.lastName}
          size={50}
          colorIndex={teacher.colorIndex}
        />
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{teacher.firstName} {teacher.lastName}</Text>
        <Text style={styles.specialty}>{teacher.specialty} · {teacher.yearsExp} yrs experience</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={colors.yellow} />
          <Text style={styles.rating}>{teacher.rating.toFixed(1)}</Text>
          <Text style={styles.sessions}>{teacher.sessions} sessions</Text>
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
