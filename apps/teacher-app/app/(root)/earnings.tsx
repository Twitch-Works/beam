import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorState, LoadingState } from '../../src/components/StateViews'
import { useTeacherEarnings } from '../../src/hooks/useTeacherEarnings'
import { colors, fontSize, fontWeight, heroOverlay, radius, shadows, spacing } from '../../src/constants/theme'

const BAR_DATA = [28, 44, 38, 62, 54, 82, 68, 50, 74]
const MAX_BAR = Math.max(...BAR_DATA)
const BAR_HEIGHT = 80

export default function EarningsScreen() {
  const { data, isError, isLoading, refetch } = useTeacherEarnings()
  const [period, setPeriod] = React.useState<'week' | 'month'>('month')

  if (isLoading) return <LoadingState message="Loading earnings" />
  if (isError || !data) return <ErrorState message="Couldn't load earnings" onRetry={refetch} />

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Total card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircle} />
          <Text style={styles.heroLabel}>Total Earnings (May)</Text>
          <Text style={styles.heroAmount}>₹56,400</Text>
          <View style={styles.heroTrendRow}>
            <Ionicons name="trending-up" size={13} color={heroOverlay.icon} />
            <Text style={styles.heroTrend}>+17% from April</Text>
          </View>
          <View style={styles.heroStats}>
            {[
              ['Wallet Balance', '₹8,640'],
              ['Pending', data.upcomingPayout],
              ['Sessions', `${data.awaitingPayoutCount}`],
            ].map(([label, value]) => (
              <View key={label}>
                <Text style={styles.heroStatLabel}>{label}</Text>
                <Text style={styles.heroStatValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chart card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Earnings Overview</Text>
            <View style={styles.toggle}>
              {(['week', 'month'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleLabel, period === p && styles.toggleLabelActive]}>
                    {p === 'week' ? 'Week' : 'Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.chart}>
            {BAR_DATA.map((val, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: (val / MAX_BAR) * BAR_HEIGHT }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Payout history */}
        <Text style={styles.sectionTitle}>Payout History</Text>
        {data.payouts.map((payout) => {
          const isPaid = payout.status === 'paid'
          return (
            <View key={payout.id} style={styles.payoutRow}>
              <View style={[styles.payoutIcon, isPaid ? styles.payoutIconPaid : styles.payoutIconPending]}>
                <Ionicons
                  name={isPaid ? 'checkmark-circle' : 'time'}
                  size={20}
                  color={isPaid ? colors.successDark : colors.warning}
                />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutAmount}>{payout.amount}</Text>
                <Text style={styles.payoutDate}>{payout.dateLabel}</Text>
              </View>
              <View style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : styles.statusBadgePending]}>
                <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                  {isPaid ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
          )
        })}
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
  heroCard: {
    borderRadius: radius.cardLg, overflow: 'hidden',
    backgroundColor: colors.primary, padding: spacing.lg,
    gap: spacing.sm, ...shadows.card,
  },
  heroCircle: {
    position: 'absolute', right: -24, top: -24,
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: heroOverlay.circle1,
  },
  heroLabel: { color: heroOverlay.label, fontSize: fontSize.body },
  heroAmount: { color: colors.white, fontSize: fontSize.display, fontWeight: fontWeight.bold },
  heroTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroTrend: { color: heroOverlay.trend, fontSize: fontSize.caption },
  heroStats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs },
  heroStatLabel: { color: heroOverlay.statLabel, fontSize: fontSize.caption },
  heroStatValue: { color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold, marginTop: 2 },
  card: {
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  cardTitle: { color: colors.navy, fontSize: fontSize.body, fontWeight: fontWeight.bold },
  toggle: { flexDirection: 'row', borderRadius: radius.input, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  toggleBtn: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleLabel: { color: colors.gray, fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
  toggleLabelActive: { color: colors.white },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_HEIGHT + 8, gap: 6 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4,
    backgroundColor: colors.mint, borderTopWidth: 2, borderTopColor: colors.primary,
  },
  sectionTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  payoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: spacing.md, ...shadows.card,
  },
  payoutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payoutIconPaid: { backgroundColor: colors.successBg },
  payoutIconPending: { backgroundColor: colors.warningBg },
  payoutInfo: { flex: 1 },
  payoutAmount: { color: colors.navy, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  payoutDate: { color: colors.gray, fontSize: fontSize.caption, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.badge },
  statusBadgePaid: { backgroundColor: colors.statusConfirmedBg },
  statusBadgePending: { backgroundColor: colors.statusUpcomingBg },
  statusText: { fontSize: fontSize.caption, fontWeight: fontWeight.bold },
  statusTextPaid: { color: colors.statusConfirmedText },
  statusTextPending: { color: colors.statusUpcomingText },
})
