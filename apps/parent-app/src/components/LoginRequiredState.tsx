import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, radius, spacing } from '@/constants/theme'

export function LoginRequiredState({
  title,
  subtitle,
  redirectTo,
}: {
  title: string
  subtitle: string
  redirectTo: string
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed-outline" size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          router.push({
            pathname: '/(auth)/login',
            params: { redirectTo },
          })
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Continue with Login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  title: {
    fontSize: fontSize.h2,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.sm,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonText: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.white,
  },
})
