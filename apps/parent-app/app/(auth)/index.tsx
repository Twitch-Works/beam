import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const { width } = Dimensions.get('window')

const SLIDES: { id: string; iconName: IoniconName; title: string; subtitle: string; bg: string; accent: string }[] = [
  {
    id: '1',
    iconName: 'color-palette-outline',
    title: 'Discover Activities\nfor Your Child',
    subtitle: 'Explore 100+ curated classes — art, music, dance, coding and more. All from the comfort of your home.',
    bg: colors.mint,
    accent: colors.primary,
  },
  {
    id: '2',
    iconName: 'person-circle-outline',
    title: 'Book Verified\nTeachers at Home',
    subtitle: 'Every teacher is background-checked and expert-trained. Your child learns safely, one-on-one.',
    bg: '#FFF4E8',
    accent: colors.yellow,
  },
  {
    id: '3',
    iconName: 'trending-up-outline',
    title: 'Watch Your Child\nGrow & Shine',
    subtitle: 'Track skills, earn badges, and celebrate milestones. See real progress after every session.',
    bg: '#F0EEFF',
    accent: colors.lavender,
  },
]

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0)
    }
  ).current

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 })
    } else {
      router.push('/(auth)/login')
    }
  }

  const handleSkip = () => {
    router.push('/(auth)/login')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={styles.emojiContainer}>
              <Ionicons name={item.iconName} size={72} color={item.accent} />
            </View>
            <Text style={[styles.title, { color: colors.navy }]}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: colors.primary, width: 24 }
                  : { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>
            {activeIndex < SLIDES.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </TouchableOpacity>

        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
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
    width: 8,
  },
  primaryBtn: {
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
  primaryBtnText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    fontFamily: 'Nunito-Bold',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.gray,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
  },
})
