import React from 'react'
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BeamImage as Image } from '@/components/BeamImage'
import { colors } from '@/constants/theme'

const BEAM_LOGO = require('../../../assets/images/beam-logo.png')
const BEAM_STAR = require('../../../assets/images/beam-star.png')

const ENTRY_MS = 1150

// Positions (fraction of the circular card box) + timing for the twinkle sprites.
const SPARKLES = [
  { x: 0.02, y: 0.12, size: 28, delay: 220 },
  { x: 0.94, y: 0.32, size: 22, delay: 420 },
  { x: 0.3, y: 0.96, size: 17, delay: 600 },
]

type Props = {
  /** Flip true once auth + persisted flags have resolved and the app can be revealed. */
  ready: boolean
  children: React.ReactNode
}

/**
 * Full-screen animated splash shown on top of the app while it boots.
 * The white card + Beam logo spring in, tiny stars twinkle around it, the
 * card gently bobs while we wait, then the whole overlay scales up and
 * fades to reveal what's underneath.
 *
 * Core RN Animated only (no Reanimated / worklets) so it runs in any Expo
 * runtime without a native rebuild. Background is the brand teal.
 */
export function AnimatedSplash({ ready, children }: Props) {
  const { width } = useWindowDimensions()
  const [entryDone, setEntryDone] = React.useState(false)
  const [gone, setGone] = React.useState(false)

  const enter = React.useRef(new Animated.Value(0)).current
  const bob = React.useRef(new Animated.Value(0)).current
  const glow = React.useRef(new Animated.Value(0)).current
  const sparkle = React.useRef(SPARKLES.map(() => new Animated.Value(0))).current
  const overlayOpacity = React.useRef(new Animated.Value(1)).current
  const groupScale = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start()

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    glowLoop.start()

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(ENTRY_MS),
        Animated.timing(bob, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )
    bobLoop.start()

    const sparkleLoops = sparkle.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(SPARKLES[i].delay),
          Animated.spring(value, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
          Animated.timing(value, {
            toValue: 0.5,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    )
    for (const l of sparkleLoops) l.start()

    const t = setTimeout(() => setEntryDone(true), ENTRY_MS)
    return () => {
      clearTimeout(t)
      glowLoop.stop()
      bobLoop.stop()
      for (const l of sparkleLoops) l.stop()
    }
  }, [enter, bob, glow, sparkle])

  React.useEffect(() => {
    if (!entryDone || !ready || gone) return
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 460,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(groupScale, {
        toValue: 1.12,
        duration: 460,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setGone(true)
    })
  }, [entryDone, ready, gone, overlayOpacity, groupScale])

  if (gone) return <View style={styles.root}>{children}</View>

  const cardSize = Math.min(width * 0.64, 300)
  const glowSize = cardSize * 1.3

  const cardOpacity = enter.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] })
  const cardScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })
  const cardSpin = enter.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '0deg'] })
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] })
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] })
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.12] })

  return (
    <View style={styles.root}>
      {children}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]}
      >
        <StatusBar style="light" />
        <Animated.View style={[styles.center, { transform: [{ scale: groupScale }] }]}>
          <Animated.View
            style={[
              styles.glow,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: bobY }, { scale: cardScale }, { rotate: cardSpin }],
            }}
          >
            <View
              style={[
                styles.card,
                { width: cardSize, height: cardSize, borderRadius: cardSize / 2 },
              ]}
            >
              <Image
                source={BEAM_LOGO}
                style={{ width: cardSize * 0.78, height: cardSize * 0.78 }}
                contentFit="contain"
              />
            </View>

            {SPARKLES.map((s, i) => (
              <Animated.View
                key={`${s.x}-${s.y}`}
                style={{
                  position: 'absolute',
                  width: s.size,
                  height: s.size,
                  left: cardSize * s.x - s.size / 2,
                  top: cardSize * s.y - s.size / 2,
                  opacity: sparkle[i],
                  transform: [
                    {
                      scale: sparkle[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    },
                  ],
                }}
              >
                <Image source={BEAM_STAR} style={styles.fill} contentFit="contain" />
              </Animated.View>
            ))}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  overlay: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
})
