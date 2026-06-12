import React from 'react'

import { Animated, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSize, fontWeight, spacing } from '../constants/theme'

type ScreenProps = {
  children: React.ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  showStatusBar?: boolean
  testID?: string
}

export function Screen({ children, contentContainerStyle, edges, showStatusBar = true, testID }: ScreenProps) {
  const opacity = React.useRef(new Animated.Value(0)).current
  const translateY = React.useRef(new Animated.Value(10)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, translateY])

  return (
    <SafeAreaView edges={edges ?? ['top']} style={styles.safeArea} testID={testID}>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, contentContainerStyle, { opacity, transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FBFD',
  },
  statusBar: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  time: {
    minWidth: 52,
    color: colors.navy,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  dynamicIsland: {
    width: 94,
    height: 26,
    borderRadius: 14,
    backgroundColor: '#050608',
  },
  systemIcons: {
    minWidth: 72,
    color: colors.navy,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
})
