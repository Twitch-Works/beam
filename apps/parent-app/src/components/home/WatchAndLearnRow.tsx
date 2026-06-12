import React, { useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'

export const WATCH_VIDEOS = [
  {
    id: '1',
    title: 'Art Tips for Kids',
    description: 'Fun watercolour tricks your child will love — no experience needed.',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Art & Craft',
    ageRange: '5–10 yrs',
    teacher: { name: 'Priya Menon', avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 4.8 },
    price: 399,
    durationMins: 45,
    likes: '3.2k',
    comments: '218',
    saves: '940',
  },
  {
    id: '2',
    title: 'Music Basics',
    description: 'Intro to rhythm and notes for little beginners — learn through play.',
    thumbnail: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Music',
    ageRange: '4–8 yrs',
    teacher: { name: 'Rahul Sharma', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 4.7 },
    price: 449,
    durationMins: 50,
    likes: '4.6k',
    comments: '312',
    saves: '1.2k',
  },
  {
    id: '3',
    title: 'Kids Yoga & Calm',
    description: '5-minute mindfulness moves that help children regulate emotions, improve focus and sleep better.',
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Wellness',
    ageRange: '4–7 yrs',
    teacher: { name: 'Deepa Lal', avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4.9 },
    price: 449,
    durationMins: 50,
    likes: '4.6k',
    comments: '312',
    saves: '1.2k',
  },
  {
    id: '4',
    title: 'Fun Sensory Play',
    description: 'Sensory activities for toddlers at home that build motor skills and creativity.',
    thumbnail: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    category: 'Sensory',
    ageRange: '1–3 yrs',
    teacher: { name: 'Kavya Sharma', avatarUrl: 'https://randomuser.me/api/portraits/women/55.jpg', rating: 4.6 },
    price: 349,
    durationMins: 30,
    likes: '2.1k',
    comments: '145',
    saves: '780',
  },
  {
    id: '5',
    title: 'Storytelling Circle',
    description: 'Boost your child\'s language and imagination through interactive stories.',
    thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Language',
    ageRange: '3–6 yrs',
    teacher: { name: 'Anita Nair', avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg', rating: 4.9 },
    price: 379,
    durationMins: 40,
    likes: '5.1k',
    comments: '401',
    saves: '1.8k',
  },
]

export const WatchAndLearnRow = React.memo(function WatchAndLearnRow() {
  const handlePress = useCallback(async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({ pathname: '/(root)/reels', params: { startIndex: String(index) } })
  }, [])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.watchRow}
    >
      {WATCH_VIDEOS.map((video, index) => (
        <TouchableOpacity
          key={video.id}
          style={styles.watchCard}
          onPress={() => handlePress(index)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: video.thumbnail }} style={styles.watchThumb} contentFit="cover" />
          <View style={styles.watchOverlay} />
          <View style={styles.watchPlayBtn}>
            <Ionicons name="play" size={18} color={colors.white} />
          </View>
          <Text style={styles.watchTitle} numberOfLines={2}>
            {video.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  watchRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  watchCard: {
    width: 130,
    height: 195,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    ...shadows.card,
  },
  watchThumb: { ...StyleSheet.absoluteFillObject },
  watchOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  watchPlayBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  watchTitle: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    fontSize: fontSize.caption,
    fontFamily: 'Nunito-SemiBold',
    color: colors.white,
    lineHeight: 16,
  },
})
