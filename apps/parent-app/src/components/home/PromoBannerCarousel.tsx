import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize } from '@/constants/theme'

const PROMO_BANNERS = [
  {
    id: 'p1',
    title: 'At-home learning',
    subtitle: 'Expert teachers at your doorstep',
    imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
    ctaLabel: 'Explore',
    deepLink: 'beam://explore',
    gradientColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.60)'] as [string, string],
  },
  {
    id: 'p2',
    title: 'Art Workshop',
    subtitle: 'New ceramics class — ages 6–12',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    ctaLabel: 'Book a Spot',
    deepLink: 'beam://explore',
    gradientColors: ['rgba(0,0,0,0.05)', 'rgba(80,30,0,0.75)'] as [string, string],
  },
  {
    id: 'p3',
    title: 'Members Save 20%',
    subtitle: 'Subscribe monthly and save on every session',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    ctaLabel: 'View Plans',
    deepLink: 'beam://explore',
    gradientColors: ['rgba(0,0,0,0.05)', 'rgba(10,20,40,0.80)'] as [string, string],
  },
] as const

type PromoBanner = (typeof PROMO_BANNERS)[number]

const BANNER_HEIGHT = 200
const PROMO_INTERVAL_MS = 4500

export const PromoBannerCarousel = React.memo(function PromoBannerCarousel() {
  const { width: screenWidth } = useWindowDimensions()
  const innerWidth = screenWidth - spacing.md * 2
  const scrollRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndexRef.current + 1) % PROMO_BANNERS.length
      activeIndexRef.current = next
      setActiveIndex(next)
      scrollRef.current?.scrollTo({ x: next * innerWidth, animated: true })
    }, PROMO_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [innerWidth])

  const handleScroll = useCallback(
    (e: any) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / innerWidth)
      activeIndexRef.current = page
      setActiveIndex(page)
    },
    [innerWidth],
  )

  const handleBannerPress = useCallback(async (banner: PromoBanner) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (banner.deepLink.startsWith('beam://')) {
      const withoutScheme = banner.deepLink.replace('beam://', '')
      const parts = withoutScheme.split('/')
      const base = parts[0]
      const id = parts[1]
      const routeMap: Record<string, string> = {
        explore: '/(root)/explore',
        bookings: '/(root)/bookings',
        kids: '/(root)/kids',
        activity: id ? `/(root)/activity/${id}` : '/(root)/explore',
        booking: id ? `/(root)/booking/${id}` : '/(root)/bookings',
      }
      router.push((routeMap[base] ?? '/(root)/explore') as any)
    } else {
      Linking.openURL(banner.deepLink)
    }
  }, [])

  return (
    <View style={[styles.bannerWrapper, { marginHorizontal: spacing.md }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ width: innerWidth, height: BANNER_HEIGHT, borderRadius: radius.card }}
      >
        {PROMO_BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.95}
            onPress={() => handleBannerPress(banner)}
            style={{ width: innerWidth, height: BANNER_HEIGHT }}
          >
            <Image
              source={{ uri: banner.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={banner.gradientColors}
              style={[StyleSheet.absoluteFill, styles.bannerGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                <View style={styles.bannerCta}>
                  <Text style={styles.bannerCtaText}>{banner.ctaLabel}</Text>
                </View>
              </View>
              <View style={styles.bannerDotsInner}>
                {PROMO_BANNERS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.bannerDot, i === activeIndex && styles.bannerDotActive]}
                  />
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  bannerWrapper: { borderRadius: radius.card, overflow: 'hidden' },
  bannerGradient: { justifyContent: 'flex-end', padding: spacing.lg },
  bannerContent: { gap: spacing.xs + 2 },
  bannerTitle: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.white },
  bannerSubtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.88)',
  },
  bannerCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.avatar,
    marginTop: spacing.xs,
  },
  bannerCtaText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.primary },
  bannerDotsInner: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bannerDotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: colors.white },
})
