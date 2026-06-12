import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent, Alert, Share,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { VideoView, useVideoPlayer } from 'expo-video'
import { colors, spacing, fontSize } from '@/constants/theme'
import { WATCH_VIDEOS } from '@/components/home/WatchAndLearnRow'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const LAVENDER = '#A7BBFA'

type WatchVideo = typeof WATCH_VIDEOS[0]

// ─── Single reel item ────────────────────────────────────────────────────────

interface ReelItemProps {
  video: WatchVideo
  isActive: boolean
  isMuted: boolean
}

const ReelItem = React.memo(({ video, isActive, isMuted }: ReelItemProps) => {
  const player = useVideoPlayer(video.videoUri, (p) => {
    p.loop = true
    p.muted = isMuted
  })

  useEffect(() => {
    if (isActive) player.play()
    else player.pause()
  }, [isActive, player])

  useEffect(() => { player.muted = isMuted }, [isMuted, player])

  return (
    <View style={styles.reelItem}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Dark gradient — bottom half */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.80)']}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  )
})

ReelItem.displayName = 'ReelItem'

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const { startIndex } = useLocalSearchParams<{ startIndex: string }>()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useState(() => parseInt(startIndex ?? '0', 10))
  const [isMuted, setIsMuted] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const video = WATCH_VIDEOS[activeIndex]
  const total = WATCH_VIDEOS.length

  useEffect(() => {
    const idx = parseInt(startIndex ?? '0', 10)
    if (idx > 0) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * SCREEN_HEIGHT, animated: false })
      }, 50)
      return () => clearTimeout(t)
    }
  }, [startIndex])

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y
    setActiveIndex(Math.round(y / SCREEN_HEIGHT))
  }, [])

  function toggleLike(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLiked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleSave(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSaved(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <View style={styles.container}>
      {/* Video scroll */}
      <ScrollView
        ref={scrollRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {WATCH_VIDEOS.map((v, index) => (
          <ReelItem key={v.id} video={v} isActive={activeIndex === index} isMuted={isMuted} />
        ))}
      </ScrollView>

      {/* ── TOP BAR ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Story progress bars */}
        <View style={styles.progressRow}>
          {WATCH_VIDEOS.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: i < activeIndex ? '100%' : i === activeIndex ? '60%' : '0%' },
              ]} />
            </View>
          ))}
        </View>

        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.navTitle}>Watch &amp; Learn</Text>
            <Text style={styles.navSubtitle}>{activeIndex + 1} / {total}</Text>
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsMuted(m => !m) }}
            style={styles.circleBtn}
            hitSlop={12}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SWIPE UP CHEVRON (center) ── */}
      <View style={styles.centerChevron} pointerEvents="none">
        <View style={styles.chevronCircle}>
          <Ionicons name="chevron-up" size={22} color={colors.white} />
        </View>
      </View>

      {/* ── RIGHT SIDEBAR ── */}
      <View style={[styles.sidebar, { bottom: insets.bottom + 180 }]}>
        {/* Teacher avatar + follow */}
        <View style={styles.sidebarItem}>
          <View style={styles.avatarWrap}>
            <Image
              source={video.teacher.avatarUrl ? { uri: video.teacher.avatarUrl } : require('../../assets/images/icon.png')}
              style={styles.teacherAvatar}
              contentFit="cover"
            />
            <View style={styles.followBtn}>
              <Ionicons name="add" size={12} color={colors.white} />
            </View>
          </View>
        </View>

        {/* Like */}
        <TouchableOpacity style={styles.sidebarItem} onPress={() => toggleLike(video.id)}>
          <Ionicons
            name={liked[video.id] ? 'heart' : 'heart-outline'}
            size={28}
            color={liked[video.id] ? '#FF7A59' : colors.white}
          />
          <Text style={styles.sidebarCount}>{video.likes}</Text>
        </TouchableOpacity>

        {/* Vertical dot indicator */}
        <View style={styles.dotIndicator}>
          {WATCH_VIDEOS.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>

        {/* Comment */}
        <TouchableOpacity style={styles.sidebarItem} onPress={() => Alert.alert('Comments', 'Coming soon.')}>
          <Ionicons name="chatbubble-outline" size={26} color={colors.white} />
          <Text style={styles.sidebarCount}>{video.comments}</Text>
        </TouchableOpacity>

        {/* Save/Bookmark */}
        <TouchableOpacity style={styles.sidebarItem} onPress={() => toggleSave(video.id)}>
          <Ionicons
            name={saved[video.id] ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={saved[video.id] ? LAVENDER : colors.white}
          />
          <Text style={styles.sidebarCount}>{video.saves}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          Share.share({ message: `${video.title} — Book a session with ${video.teacher.name} on Beam!\n\nbeam://explore` })
        }}>
          <Ionicons name="share-social-outline" size={26} color={colors.white} />
          <Text style={styles.sidebarCount}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM CONTENT ── */}
      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 140 }]}>
        {/* Category pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{video.category} · {video.ageRange}</Text>
        </View>

        {/* Title */}
        <Text style={styles.reelTitle}>{video.title}</Text>

        {/* Description */}
        <Text style={styles.reelDesc} numberOfLines={3}>{video.description}</Text>

        {/* Teacher row */}
        <View style={styles.teacherRow}>
          <Image
            source={video.teacher.avatarUrl ? { uri: video.teacher.avatarUrl } : require('../../assets/images/icon.png')}
            style={styles.teacherRowAvatar}
            contentFit="cover"
          />
          <Text style={styles.teacherRowName}>{video.teacher.name}</Text>
          <Ionicons name="star" size={13} color="#FCB857" />
          <Text style={styles.teacherRowRating}>{video.teacher.rating}</Text>
        </View>
      </View>

      {/* ── BOOK NOW CTA ── */}
      <View style={[styles.ctaCard, { bottom: insets.bottom + 24 }]}>
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPerSession}>Per session</Text>
          <Text style={styles.ctaPrice}>₹{video.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(root)/explore') }}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Book Now · {video.durationMins} min</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  reelItem: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#111' },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 2,
  },
  progressTrack: {
    flex: 1, height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.white, borderRadius: 2 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { alignItems: 'center' },
  navTitle: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.white },
  navSubtitle: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  // Center chevron
  centerChevron: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 22,
    left: 0, right: 0,
    alignItems: 'center',
  },
  chevronCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Right sidebar
  sidebar: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  sidebarItem: { alignItems: 'center', gap: 4 },
  sidebarCount: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.white },

  avatarWrap: { position: 'relative' },
  teacherAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: colors.white,
  },
  followBtn: {
    position: 'absolute', bottom: -6, left: '50%',
    marginLeft: -9,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: LAVENDER,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.white,
  },

  // Dot indicator (between like and comment)
  dotIndicator: { alignItems: 'center', gap: 4 },
  dot: { borderRadius: 3 },
  dotActive: { width: 4, height: 16, backgroundColor: colors.white },
  dotInactive: { width: 4, height: 4, backgroundColor: 'rgba(255,255,255,0.45)' },

  // Bottom content (text info)
  bottomContent: {
    position: 'absolute', bottom: 0, left: 0,
    right: 80,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: LAVENDER,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.white },
  reelTitle: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.white, lineHeight: 30 },
  reelDesc: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.82)', lineHeight: 22 },

  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherRowAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.white },
  teacherRowName: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.white },
  teacherRowRating: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: '#FCB857' },

  // Book Now CTA
  ctaCard: {
    position: 'absolute', left: spacing.md, right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  ctaLeft: { gap: 2 },
  ctaPerSession: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.75)' },
  ctaPrice: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.white },
  ctaBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: LAVENDER },
})
