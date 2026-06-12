import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

export const ClassPacksBanner = React.memo(function ClassPacksBanner() {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return (
    <TouchableOpacity style={styles.banner} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.iconWrap}>
        <Ionicons name="gift-outline" size={26} color={colors.white} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Class Packs</Text>
        <Text style={styles.subtitle}>5 sessions – save 20%</Text>
      </View>
      <View style={styles.viewBtn}>
        <Text style={styles.viewText}>View</Text>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.button,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 3 },
  title: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.82)',
  },
  viewBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  viewText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
  },
})
