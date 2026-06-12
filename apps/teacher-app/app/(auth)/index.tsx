import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../src/components/Button'
import { Screen } from '../../src/components/Screen'
import { useAuth } from '../../src/lib/AuthContext'
import { colors, fontSize, fontWeight, heroOverlay, radius, spacing } from '../../src/constants/theme'

const features: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; fg: string }[] = [
  { icon: 'calendar',    label: 'Sessions',  bg: colors.mint,       fg: colors.primary },
  { icon: 'wallet',      label: 'Earnings',  bg: colors.warningBg,  fg: colors.warning },
  { icon: 'chatbubbles', label: 'Messages',  bg: colors.lavenderBg, fg: colors.lavenderDark },
  { icon: 'bar-chart',   label: 'Analytics', bg: colors.successBg,  fg: colors.successDark },
]

export default function WelcomeScreen() {
  const { session, isLoading } = useAuth()

  React.useEffect(() => {
    if (!isLoading && session) {
      const onboardingComplete = session.user.user_metadata?.onboarding_complete
      if (onboardingComplete) {
        router.replace('/(root)')
      } else {
        router.replace('/(auth)/onboarding/profile')
      }
    }
  }, [session, isLoading])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoB}>B</Text>
          </View>
          <Text style={styles.logoText}>beam</Text>
        </View>
        <View style={styles.secureChip}>
          <Ionicons name="lock-closed" size={11} color={colors.primary} />
          <Text style={styles.secureLabel}>Secure Access</Text>
        </View>
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>FOR TEACHERS</Text>
        <Text style={styles.heroTitle}>Empowering teachers,{'\n'}one session at a time</Text>
        <Text style={styles.heroBody}>
          Manage your schedule, track earnings, and connect with families — all from one place.
        </Text>
      </View>

      {/* Feature chips */}
      <View style={styles.featureRow}>
        {features.map((f) => (
          <View key={f.label} style={[styles.featureChip, { backgroundColor: f.bg }]}>
            <Ionicons name={f.icon} size={18} color={f.fg} />
            <Text style={[styles.featureLabel, { color: f.fg }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Button label="Get Started" onPress={() => router.push('/(auth)/login')} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={14} color={colors.gray} />
        <Text style={styles.footerText}>Trusted by 500+ teachers across India</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoB: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  logoText: {
    color: colors.navy,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  secureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.badge,
  },
  secureLabel: {
    color: colors.primary,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.bold,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
  },
  heroEyebrow: {
    color: heroOverlay.statLabelMd,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: 30,
  },
  heroBody: {
    marginTop: spacing.sm,
    color: heroOverlay.trend,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  featureLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  cta: {
    marginTop: 'auto',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: colors.gray,
    fontSize: fontSize.caption,
  },
})
