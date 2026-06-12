import React from 'react'
import { Animated, ViewStyle } from 'react-native'
import { colors } from '@/constants/theme'

interface SkeletonProps {
  width?: number | `${number}%`
  height: number
  radius?: number
  style?: ViewStyle
}

export const Skeleton = React.memo(function Skeleton({ width = '100%', height, radius = 8, style }: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  )
})
