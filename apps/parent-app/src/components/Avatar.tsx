import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/theme'

export const AVATAR_COLORS = [colors.primary, colors.yellow, colors.coral, colors.lavender, '#0F7A6B']

function getInitials(firstName: string, lastName?: string | null): string {
  const f = firstName[0]?.toUpperCase() ?? ''
  const l = lastName?.[0]?.toUpperCase() ?? ''
  return f + l
}

interface AvatarProps {
  firstName: string
  lastName?: string | null
  size?: number
  color?: string
  colorIndex?: number
}

export const Avatar = React.memo(function Avatar({ firstName, lastName, size = 44, color, colorIndex }: AvatarProps) {
  const bg = color ?? AVATAR_COLORS[(colorIndex ?? 0) % AVATAR_COLORS.length]
  const initials = getInitials(firstName, lastName)
  const fs = Math.round(size * 0.36)

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: fs }]}>{initials}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Nunito-Bold',
    color: colors.white,
  },
})
