import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Switch, Share, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'
import { useAuth } from '@/lib/AuthContext'
import { useChildren } from '@/hooks/useChildren'
import { useBookings } from '@/hooks/useBookings'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { ProfileUserCard } from '@/components/profile/ProfileUserCard'
import { ProfileStats } from '@/components/profile/ProfileStats'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface MenuItemProps {
  icon: IoniconName
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (v: boolean) => void
}

const MenuItem = React.memo(function MenuItem({ icon, label, value, onPress, danger, toggle, toggleValue, onToggle }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={toggle ? 1 : 0.7} disabled={toggle}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#FEE2E2' : colors.mint }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
        {toggle ? (
          <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
        ) : (
          !danger && <Ionicons name="chevron-forward" size={16} color={colors.border} />
        )}
      </View>
    </TouchableOpacity>
  )
})

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const [notifEnabled, setNotifEnabled] = React.useState(true)
  const { signOut, user } = useAuth()
  const { data: childrenData, isLoading: childrenLoading } = useChildren()
  const { data: completedData, isLoading: bookingsLoading } = useBookings('completed')
  const isLoading = childrenLoading || bookingsLoading

  const childrenCount   = childrenData?.items?.length ?? 0
  const sessionsCount   = completedData?.items?.length ?? 0
  const activitiesCount = useMemo(
    () => new Set(completedData?.items?.map(b => b.activityId).filter(Boolean)).size,
    [completedData],
  )

  const firstName = (user?.user_metadata?.firstName as string | undefined) ?? ''
  const lastName  = (user?.user_metadata?.lastName  as string | undefined) ?? ''
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Account'
  const initial   = fullName[0]?.toUpperCase() ?? 'U'
  const city      = (user?.user_metadata?.city as string | undefined) ?? ''
  const rawPhone  = typeof user?.phone === 'string' && user.phone.length > 0
    ? user.phone
    : ((user?.user_metadata?.phone as string | undefined) ?? '')
  const phone     = rawPhone ? `+91 ${rawPhone.replace('+91', '').replace(/(\d{5})(\d{5})/, '$1 $2')}` : ''

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await signOut()
    router.replace('/(auth)/')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {isLoading ? <ProfileSkeleton bottomInset={insets.bottom} /> : null}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        style={isLoading ? { display: 'none' } : undefined}
      >
        <ProfileUserCard fullName={fullName} initial={initial} phone={phone} city={city} />
        <ProfileStats sessions={sessionsCount} activities={activitiesCount} children={childrenCount} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="person-outline"   label="Edit Profile"     onPress={() => router.push('/(root)/profile/edit')} />
            <MenuItem icon="location-outline" label="Delivery Address" value={city || 'Add address'} onPress={() => Alert.alert('Delivery Address', 'Your sessions are delivered to your registered city. Update it in Edit Profile.')} />
            <MenuItem icon="card-outline"     label="Payment Methods"  onPress={() => Alert.alert('Payment Methods', 'Payment details are entered at checkout via Razorpay.')} />
            <MenuItem icon="gift-outline"     label="Refer & Earn"     onPress={async () => { await Share.share({ message: 'Join Beam and get your first session free! Use my referral: https://beamkids.in/refer' }) }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="notifications-outline" label="Push Notifications" toggle toggleValue={notifEnabled} onToggle={setNotifEnabled} />
            <MenuItem icon="language-outline" label="Language" value="English" onPress={() => {}} />
            <MenuItem icon="shield-checkmark-outline" label="Privacy Settings" onPress={() => Linking.openURL('https://beamkids.in/privacy')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="chatbubble-ellipses-outline" label="Chat with Us" onPress={() => Linking.openURL('https://wa.me/919999999999')} />
            <MenuItem icon="help-circle-outline" label="FAQs" onPress={() => Linking.openURL('https://beamkids.in/faq')} />
            <MenuItem icon="document-text-outline" label="Terms & Privacy" onPress={() => Linking.openURL('https://beamkids.in/terms')} />
            <MenuItem icon="star-outline" label="Rate the App" onPress={() => Linking.openURL('https://apps.apple.com/app/beam')} />
          </View>
        </View>

        <View style={styles.sosCard}>
          <Ionicons name="warning-outline" size={22} color={colors.coral} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Emergency SOS</Text>
            <Text style={styles.sosSubtitle}>Visible during active sessions for quick teacher contact</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <MenuItem icon="log-out-outline" label="Log Out" onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={styles.version}>Beam v1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  header: { backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: fontSize.h1, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.navy },
  scroll: { padding: spacing.md, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHeader: { fontSize: fontSize.caption, fontWeight: fontWeight.semibold, fontFamily: 'Nunito-SemiBold', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.xs },
  menuGroup: { backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden', ...shadows.card },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  menuIcon: { width: 36, height: 36, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuValue: { fontSize: fontSize.body, color: colors.gray, fontFamily: 'Nunito-Regular' },
  sosCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#FFF4F2', borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: '#FFD5CC' },
  sosTitle: { fontSize: fontSize.body, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.coral },
  sosSubtitle: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-Regular', marginTop: 2 },
  version: { textAlign: 'center', fontSize: fontSize.caption, color: colors.border, fontFamily: 'Nunito-Regular', paddingVertical: spacing.md },
})
