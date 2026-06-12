import React from 'react'
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, shadows, spacing } from '../constants/theme'

type CardProps = {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const Card = React.memo(function Card({ children, style, testID }: CardProps) {
  const scale = React.useRef(new Animated.Value(0.98)).current

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 18,
      stiffness: 140,
      useNativeDriver: true,
    }).start()
  }, [scale])

  return <Animated.View style={[styles.card, { transform: [{ scale }] }, style]} testID={testID}>{children}</Animated.View>
})

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E7EEF4',
    ...shadows.card,
  },
})
