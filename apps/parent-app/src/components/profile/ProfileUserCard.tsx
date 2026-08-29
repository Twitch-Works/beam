import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme'

interface ProfileUserCardProps {
  fullName: string
  initial: string
  phone: string
  city: string
}

export function ProfileUserCard({ fullName, initial, phone, city }: ProfileUserCardProps) {
  return (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{fullName}</Text>
        {!!phone && <Text style={styles.userPhone}>{phone}</Text>}
        {!!city && (
          <View style={styles.userCityRow}>
            <Ionicons name="location-outline" size={14} color={colors.gray} />
            <Text style={styles.userCity}>{city}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.mint,
  },
  avatarText: { fontSize: fontSize.h2, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.white },
  userInfo: { flex: 1 },
  userName: { fontSize: fontSize.h3, fontWeight: fontWeight.bold, fontFamily: 'Nunito-Bold', color: colors.navy },
  userPhone: { fontSize: fontSize.body, color: colors.gray, fontFamily: 'Nunito-Regular' },
  userCityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  userCity: { fontSize: fontSize.caption, color: colors.gray, fontFamily: 'Nunito-Regular' },
})
