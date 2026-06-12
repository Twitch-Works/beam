import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Card } from '../../../src/components/Card'
import { Chip } from '../../../src/components/Chip'
import { EmptyState, ErrorState, LoadingState } from '../../../src/components/StateViews'
import { Screen } from '../../../src/components/Screen'
import { StatusBadge } from '../../../src/components/StatusBadge'
import { useTeacherSession } from '../../../src/hooks/useTeacherSessions'
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/constants/theme'

export default function SessionDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { data, isError, isLoading, refetch } = useTeacherSession(bookingId)

  if (isLoading) return <LoadingState message="Loading session" />
  if (isError) return <ErrorState message="Couldn't load session" onRetry={refetch} />
  if (!data) return <EmptyState message="Session not found" cta="Back to sessions" />

  return (
    <Screen>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Session Details</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.navy} />
        </TouchableOpacity>
      </View>
      <View style={styles.alert}>
        <Text style={styles.alertTitle}>Session starts in 1 hour 47 minutes</Text>
        <View style={styles.alertLinkRow}>
          <Text style={styles.alertText}>Start navigation now</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.statusUpcomingText} />
        </View>
      </View>

      <Card style={styles.card}>
        <Text style={styles.label}>Activity</Text>
        <View style={styles.activityRow}>
          <View style={styles.thumbnail}>
            <Ionicons name="color-palette-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.activityText}>
            <Text style={styles.value}>{data.activityTitle}</Text>
            <Text style={styles.meta}>Art & Craft • 60 minutes</Text>
            <Text style={styles.price}>₹649</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.value}>{data.childName} Mehta</Text>
            <Text style={styles.meta}>3 years old</Text>
            <Text style={styles.meta}>Interests: Art, Music</Text>
          </View>
          <StatusBadge status={data.status} />
        </View>
        <View style={styles.note}>
          <Text style={styles.alertTitle}>Parent note: gluten allergy</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.gray} />
          <Text style={styles.meta}>{data.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.gray} />
          <Text style={styles.meta}>Wed 16 Apr • {data.timeRange}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Materials Checklist</Text>
          <Text style={styles.meta}>3 of 5 packed</Text>
        </View>
        <View style={styles.chips}>
          <Chip label="paints" tone="mint" />
          <Chip label="paper" tone="mint" />
          <Chip label="apron" tone="gray" />
          <Chip label="wipes" tone="mint" />
          <Chip label="sticker" tone="gray" />
        </View>
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Call Parent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Message</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => router.push(`/(root)/session/active/${bookingId}`)}
      >
        <Ionicons name="play-circle" size={20} color={colors.white} />
        <Text style={styles.startBtnText}>Start Session</Text>
      </TouchableOpacity>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: colors.navy,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  alert: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.statusUpcomingBg,
  },
  alertTitle: {
    color: colors.statusUpcomingText,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  alertText: {
    color: colors.statusUpcomingText,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  activityText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.gray,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.navy,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    color: colors.gray,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  price: {
    marginTop: spacing.xs,
    color: colors.navy,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  note: {
    borderRadius: 10,
    padding: spacing.sm,
    backgroundColor: colors.statusUpcomingBg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 10,
  },
  secondaryBtnText: { color: colors.primary, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: radius.button, paddingVertical: 14,
  },
  startBtnText: { color: colors.white, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
})
