import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorState, LoadingState } from '../../src/components/StateViews'
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard'
import { useTeacherProfile } from '../../src/hooks/useTeacherProfile'
import { colors, fontSize, fontWeight, heroOverlay, radius, shadows, spacing } from '../../src/constants/theme'

const QUICK_ACTIONS = [
  { icon: 'calendar-outline' as const,   label: 'Schedule',  bg: colors.mint,       fg: colors.primary },
  { icon: 'chatbubbles-outline' as const, label: 'Messages', bg: colors.lavenderBg, fg: colors.lavenderDark },
  { icon: 'checkbox-outline' as const,   label: 'Checklist', bg: colors.warningBg,  fg: colors.warning },
  { icon: 'wallet-outline' as const,     label: 'Earnings',  bg: colors.successBg,  fg: colors.successDark },
] as const

export default function DashboardScreen() {
  const { data, isError, isLoading, refetch } = useTeacherDashboard()
  const { data: profile } = useTeacherProfile()

  if (isLoading) return <LoadingState message="Loading dashboard" />
  if (isError || !data) return <ErrorState message="Couldn't load dashboard" onRetry={refetch} />

  const firstName = profile?.teacher.firstName ?? 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}><Text style={styles.logoB}>B</Text></View>
            <Text style={styles.logoText}>beam</Text>
          </View>
          <Text style={styles.welcome}>Welcome back, {firstName}! 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.bell} onPress={() => router.push('/(root)/notifications')}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Earnings hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>Today's Earnings</Text>
              <TouchableOpacity onPress={() => router.push('/(root)/earnings')}>
                <Text style={styles.heroViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroAmount}>{data.earningsPreview}</Text>
            <View style={styles.heroTrendRow}>
              <Ionicons name="trending-up" size={13} color={heroOverlay.icon} />
              <Text style={styles.heroTrend}>+18% from yesterday</Text>
            </View>
            <View style={styles.heroStats}>
              {[
                ['Sessions Today', `${data.todaySessionCount}`],
                ['This Week', '₹32,400'],
                ['Rating', '4.9 ★'],
              ].map(([label, value]) => (
                <View key={label} style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{label}</Text>
                  <Text style={styles.heroStatValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Next session */}
        {data.nextSession && (
          <View style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <View style={styles.nextHeaderLeft}>
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <Text style={styles.nextUpLabel}>Next Session</Text>
              </View>
              <Text style={styles.nextTime}>{data.nextSession.timeRange}</Text>
            </View>
            <Text style={styles.nextTitle}>{data.nextSession.activityTitle}</Text>
            <Text style={styles.nextMeta}>{data.nextSession.childName} · {data.nextSession.location}</Text>
            <View style={styles.nextActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push(`/(root)/session/${data.nextSession!.id}`)}
              >
                <Ionicons name="play-circle" size={16} color={colors.white} />
                <Text style={styles.startBtnText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapBtn}>
                <Ionicons name="map-outline" size={16} color={colors.primary} />
                <Text style={styles.mapBtnText}>Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Checklist reminder */}
        {data.pendingChecklistCount > 0 && (
          <TouchableOpacity style={styles.checklistBanner} onPress={() => router.push('/(root)/checklist')}>
            <Ionicons name="alert-circle" size={18} color={colors.warning} />
            <Text style={styles.checklistText}>
              {data.pendingChecklistCount} checklist item{data.pendingChecklistCount > 1 ? 's' : ''} pending before your next session
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.label} style={[styles.quickCard, { backgroundColor: action.bg }]}>
              <Ionicons name={action.icon} size={22} color={action.fg} />
              <Text style={[styles.quickLabel, { color: action.fg }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightGray },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  logoMark: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  logoB: { color: colors.primary, fontSize: 16, fontWeight: fontWeight.bold },
  logoText: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  welcome: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  date: { color: colors.gray, fontSize: fontSize.caption, marginTop: 2 },
  bell: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 10, right: 10,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.coral, borderWidth: 1.5, borderColor: colors.white,
  },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  // Hero card
  heroCard: {
    borderRadius: radius.cardLg, overflow: 'hidden',
    backgroundColor: colors.primary, padding: spacing.lg,
    ...shadows.card,
  },
  heroCircle1: {
    position: 'absolute', right: -32, top: -32,
    width: 144, height: 144, borderRadius: 72,
    backgroundColor: heroOverlay.circle1,
  },
  heroCircle2: {
    position: 'absolute', right: 32, bottom: -48,
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: heroOverlay.circle2,
  },
  heroInner: { gap: spacing.sm },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: heroOverlay.label, fontSize: fontSize.body },
  heroViewAll: {
    color: colors.white, fontSize: fontSize.micro, fontWeight: fontWeight.semibold,
    backgroundColor: heroOverlay.badge, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
  },
  heroAmount: { color: colors.white, fontSize: fontSize.display, fontWeight: fontWeight.bold },
  heroTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroTrend: { color: heroOverlay.trend, fontSize: fontSize.caption },
  heroStats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  heroStat: {
    flex: 1, backgroundColor: heroOverlay.statBg,
    borderRadius: radius.button, padding: spacing.sm,
  },
  heroStatLabel: { color: heroOverlay.statLabelMd, fontSize: fontSize.micro },
  heroStatValue: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold, marginTop: 2 },
  // Next session card
  nextCard: {
    backgroundColor: colors.warningBg, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.yellow, padding: spacing.md,
    gap: spacing.sm,
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nextUpLabel: { color: colors.warning, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  nextTime: { color: colors.navy, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  nextTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  nextMeta: { color: colors.gray, fontSize: fontSize.body },
  nextActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 10,
  },
  startBtnText: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.button,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  mapBtnText: { color: colors.primary, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  // Checklist banner
  checklistBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.warningBg, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.yellow, padding: spacing.md,
  },
  checklistText: { flex: 1, color: colors.statusUpcomingText, fontSize: fontSize.body },
  // Quick actions
  sectionTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCard: {
    width: '47%', borderRadius: radius.card, padding: spacing.md,
    alignItems: 'center', gap: spacing.sm,
  },
  quickLabel: { fontSize: fontSize.body, fontWeight: fontWeight.semibold },
})
