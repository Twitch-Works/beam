import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { Button } from '@/components/Button'

interface TeacherActivity {
  id: string
  title: string
  sessionDurationMins: number
  ageGroup: string
  pricePerSession: string
}

interface TeacherClassCardProps {
  activity: TeacherActivity
  onBook: () => void
}

export const TeacherClassCard = React.memo(function TeacherClassCard({ activity, onBook }: TeacherClassCardProps) {
  return (
    <View style={styles.classCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.classTitle}>{activity.title}</Text>
        <View style={styles.classMeta}>
          <Ionicons name="time-outline" size={13} color={colors.gray} />
          <Text style={styles.classMetaText}>{activity.sessionDurationMins} min</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="people-outline" size={13} color={colors.gray} />
          <Text style={styles.classMetaText}>{activity.ageGroup}</Text>
        </View>
        <Text style={styles.classPrice}>₹{parseFloat(activity.pricePerSession).toFixed(0)} / session</Text>
      </View>
      <Button label="Book" variant="primary" size="sm" fullWidth={false} onPress={onBook} />
    </View>
  )
})

const styles = StyleSheet.create({
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  classTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.navy, marginBottom: spacing.xs },
  classMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  classMetaText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.gray },
  dot: { color: colors.border, fontSize: 14 },
  classPrice: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.primary },
})
