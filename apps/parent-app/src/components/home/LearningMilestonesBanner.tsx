import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

const SKILLS = [
  { label: 'Creativity', fill: 0.72 },
  { label: 'Focus',      fill: 0.55 },
  { label: 'Social',     fill: 0.63 },
]

export const LearningMilestonesBanner = React.memo(function LearningMilestonesBanner() {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/(root)/kids')
  }

  return (
    <TouchableOpacity style={styles.banner} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="star" size={20} color={colors.lavender} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Learning Milestones</Text>
          <Text style={styles.subtitle}>Track creativity, focus & social skills</Text>
        </View>
      </View>

      <View style={styles.skills}>
        {SKILLS.map((skill) => (
          <View key={skill.label} style={styles.skillItem}>
            <Text style={styles.skillLabel}>{skill.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${skill.fill * 100}%` as any }]} />
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.lavender + '28',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.lavender + '55',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
  subtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
  },
  skills: { flexDirection: 'row', gap: spacing.md },
  skillItem: { flex: 1, gap: spacing.xs },
  skillLabel: {
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.navy,
  },
  track: {
    height: 5,
    backgroundColor: colors.lavender + '44',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.lavender,
    borderRadius: 3,
  },
})
