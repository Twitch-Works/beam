import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface ActivityAboutTabProps {
  description: string
  tags: string[]
  materialsNeeded?: string | null
}

export function ActivityAboutTab({ description, tags, materialsNeeded }: ActivityAboutTabProps) {
  const includeItems = materialsNeeded ? materialsNeeded.split('\n').filter(Boolean) : []

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{description}</Text>

      {tags.length > 0 && (
        <>
          <Text style={styles.subHeading}>Skills Developed</Text>
          <View style={styles.skillsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.skillPill}>
                <Text style={styles.skillText}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {includeItems.length > 0 && (
        <>
          <Text style={styles.subHeading}>What's Included</Text>
          {includeItems.map((item) => (
            <View key={item} style={styles.includeRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  description: {
    fontSize: fontSize.bodyLg,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    lineHeight: 26,
  },
  subHeading: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    marginTop: spacing.sm,
  },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillPill: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.avatar,
  },
  skillText: { fontSize: fontSize.body, color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  includeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  includeText: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
    lineHeight: 22,
  },
})
