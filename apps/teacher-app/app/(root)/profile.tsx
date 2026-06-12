import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorState, LoadingState } from '../../src/components/StateViews'
import { useAuth } from '../../src/lib/AuthContext'
import { useTeacherProfile } from '../../src/hooks/useTeacherProfile'
import { colors, fontSize, fontWeight, radius, shadows, spacing } from '../../src/constants/theme'

type MenuRow = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress?: () => void
  danger?: boolean
}

export default function ProfileScreen() {
  const { data, isError, isLoading, refetch } = useTeacherProfile()
  const { signOut } = useAuth()

  if (isLoading) return <LoadingState message="Loading profile" />
  if (isError || !data) return <ErrorState message="Couldn't load profile" onRetry={refetch} />

  const menuSections: MenuRow[][] = [
    [
      { icon: 'calendar-outline', label: 'Schedule & Availability', onPress: () => router.push('/(root)/availability') },
      { icon: 'shield-checkmark-outline', label: 'Verification Status', onPress: () => router.push('/(auth)/onboarding/verification') },
      { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(root)/notifications') },
    ],
    [
      { icon: 'wallet-outline', label: 'Earnings History', onPress: () => router.push('/(root)/earnings') },
      { icon: 'help-circle-outline', label: 'Help & Support' },
    ],
    [
      { icon: 'log-out-outline', label: 'Log Out', onPress: signOut, danger: true },
    ],
  ]

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(root)/profile/edit')}>
          <Ionicons name="settings-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{data.initials}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name}>{data.teacher.firstName} {data.teacher.lastName}</Text>
            <Text style={styles.role}>{data.skills.slice(0, 2).join(' & ')} Educator</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={colors.yellow} />
              <Text style={styles.rating}>{data.teacher.rating} · {data.teacher.reviewCount} reviews</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            ['45', 'Sessions'],
            [String(data.teacher.reviewCount), 'Reviews'],
            [data.city, 'City'],
          ].map(([val, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Skills chips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specialisations</Text>
          <View style={styles.chips}>
            {data.skills.map((skill) => (
              <View key={skill} style={styles.chip}>
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
            {data.languages.map((lang) => (
              <View key={lang} style={[styles.chip, styles.chipGray]}>
                <Text style={[styles.chipText, styles.chipTextGray]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            {section.map((row, ri) => (
              <TouchableOpacity
                key={row.label}
                style={[styles.menuRow, ri < section.length - 1 && styles.menuRowBorder]}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, row.danger && styles.menuIconDanger]}>
                  <Ionicons name={row.icon} size={18} color={row.danger ? colors.error : colors.primary} />
                </View>
                <Text style={[styles.menuLabel, row.danger && styles.menuLabelDanger]}>{row.label}</Text>
                {!row.danger && <Ionicons name="chevron-forward" size={16} color={colors.gray} />}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.navy, fontSize: fontSize.h2, fontWeight: fontWeight.bold },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  identityCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, ...shadows.card,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: radius.card,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.h2, fontWeight: fontWeight.bold },
  verifiedBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: colors.white, borderRadius: 9, padding: 1,
  },
  identity: { flex: 1, gap: 4 },
  name: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  role: { color: colors.gray, fontSize: fontSize.body },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { color: colors.navy, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, ...shadows.card,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  statLabel: { color: colors.gray, fontSize: fontSize.caption },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, gap: spacing.sm, ...shadows.card,
  },
  cardTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.mint, paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: radius.badge,
  },
  chipGray: { backgroundColor: colors.lightGray },
  chipText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  chipTextGray: { color: colors.gray },
  menuSection: {
    backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: colors.statusCancelledBg },
  menuLabel: { flex: 1, color: colors.navy, fontSize: fontSize.body },
  menuLabelDanger: { color: colors.error },
})
