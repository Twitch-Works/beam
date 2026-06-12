import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

interface ScreenHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
  border?: boolean
}

export const ScreenHeader = React.memo(function ScreenHeader({ title, onBack, right, border = true }: ScreenHeaderProps) {
  const handleBack = React.useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onBack?.()
  }, [onBack])

  return (
    <View style={[styles.header, border && styles.headerBorder]}>
      {onBack ? (
        <TouchableOpacity style={styles.sideSlot} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideSlot} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.sideSlot}>{right ?? null}</View>
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sideSlot: {
    width: 40,
    height: 40,
    borderRadius: radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
})
