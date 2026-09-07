import React from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { BeamImage as Image } from '@/components/BeamImage'
import * as Haptics from 'expo-haptics'
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme'

const BEAM_STAR = require('../../../assets/images/beam-star.png')

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

type Slide = {
  id: string
  icon: IoniconName
  title: string
  subtitle: string
  bg: string
  accent: string
}

const { width } = Dimensions.get('window')

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    icon: 'sparkles-outline',
    title: 'Welcome to Beam',
    subtitle:
      'Fun learning journeys begin here — with joyful activities, caring teachers, and progress your child can see.',
    bg: colors.mint,
    accent: colors.primary,
  },
  {
    id: 'discover',
    icon: 'color-palette-outline',
    title: 'Discover Activities\nfor Your Child',
    subtitle:
      'Explore 100+ curated classes — art, music, dance, coding and more. All from the comfort of your home.',
    bg: '#EAF7FA',
    accent: colors.primary,
  },
  {
    id: 'verified',
    icon: 'shield-checkmark-outline',
    title: 'Book Verified\nTeachers at Home',
    subtitle:
      'Every teacher is background-checked and expert-trained. Your child learns safely, one-on-one.',
    bg: '#FFF4E8',
    accent: colors.yellow,
  },
  {
    id: 'grow',
    icon: 'trending-up-outline',
    title: 'Watch Your Child\nGrow & Shine',
    subtitle:
      'Track skills, earn badges, and celebrate milestones. See real progress after every session.',
    bg: '#F0EEFF',
    accent: colors.lavender,
  },
]

function SlideView({ slide, focused }: { slide: Slide; focused: boolean }) {
  const progress = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: focused ? 460 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [focused, progress])

  const artScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] })
  const textShift = progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })

  return (
    <View style={styles.slide}>
      <Animated.View
        style={[styles.art, { opacity: progress, transform: [{ scale: artScale }] }]}
      >
        <View style={[styles.blob, { backgroundColor: slide.bg }]} />
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={76} color={slide.accent} />
          <View style={styles.starBadge}>
            <Image source={BEAM_STAR} style={styles.starBadgeImg} contentFit="contain" />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: progress, transform: [{ translateY: textShift }] }}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  )
}

function Dot({ active }: { active: boolean }) {
  const w = React.useRef(new Animated.Value(active ? 24 : 8)).current

  React.useEffect(() => {
    Animated.spring(w, {
      toValue: active ? 24 : 8,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start()
  }, [active, w])

  return (
    <Animated.View
      style={[styles.dot, active ? styles.dotActive : styles.dotIdle, { width: w }]}
    />
  )
}

export function IntroCarousel({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = React.useState(0)
  const listRef = React.useRef<FlatList<Slide>>(null)

  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]
      if (first?.index != null) setIndex(first.index)
    },
  ).current
  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 60 }).current

  const isLast = index === SLIDES.length - 1

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isLast) {
      onDone()
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1 })
  }

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDone()
  }

  const renderItem = React.useCallback(
    ({ item, index: i }: { item: Slide; index: number }) => (
      <SlideView slide={item} focused={i === index} />
    ),
    [index],
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <Dot key={slide.id} active={i === index} />
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skip} hitSlop={12}>
          <Text style={[styles.skipText, isLast && styles.skipTextHidden]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 160,
  },
  art: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  blob: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 110,
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  starBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeImg: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.bodyLg,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotIdle: {
    backgroundColor: colors.border,
  },
  cta: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
  },
  skip: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.gray,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
  },
  skipTextHidden: {
    opacity: 0,
  },
})
