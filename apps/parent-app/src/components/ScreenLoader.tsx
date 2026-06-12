import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '@/constants/theme'

interface ScreenLoaderProps {
  color?: string
}

export function ScreenLoader({ color = colors.primary }: ScreenLoaderProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightGray }}>
      <ActivityIndicator size="large" color={color} />
    </View>
  )
}
