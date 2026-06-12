import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

interface HomeHeaderProps {
  firstName: string
  city: string
  searchText: string
  onSearchChange: (text: string) => void
  onLocationPress: () => void
}

export const HomeHeader = React.memo(function HomeHeader({
  firstName,
  city,
  searchText,
  onSearchChange,
  onLocationPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>{getTimeGreeting()}</Text>
          <Text style={styles.firstName}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(root)/kids')}>
            <Text style={styles.avatarBtnText}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.navy} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.locationRow} onPress={onLocationPress} activeOpacity={0.7}>
        <Ionicons name="location" size={15} color={colors.primary} />
        <Text style={styles.locationText}>{city}</Text>
        <Ionicons name="chevron-down" size={13} color={colors.gray} />
      </TouchableOpacity>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities, teachers…"
          placeholderTextColor={colors.gray}
          value={searchText}
          onChangeText={onSearchChange}
        />
        {searchText.length > 0 ? (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(root)/explore')}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
})

function getTimeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    marginBottom: 1,
  },
  firstName: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    lineHeight: 34,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarBtnText: {
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locationText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
  },
})
