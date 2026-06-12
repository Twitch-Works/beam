import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { useChildProgress } from '@/hooks/useChildProgress'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_SIZE = Math.min(SCREEN_WIDTH - spacing.md * 4, 280)
const CENTER = CHART_SIZE / 2
const MAX_R = CENTER - 36

const AXIS_KEYS = ['creativity', 'motor', 'language', 'social', 'focus'] as const
const AXIS_LABELS: Record<string, string> = {
  creativity: 'Creativity',
  motor:      'Motor Skills',
  language:   'Language',
  social:     'Social Skills',
  focus:      'Focus',
}
const N = AXIS_KEYS.length
const LEVELS = 4

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) }
}

function ringPoints(r: number): string {
  return Array.from({ length: N }, (_, i) => {
    const { x, y } = polar((360 / N) * i, r)
    return `${x},${y}`
  }).join(' ')
}

function makeScorePoints(axes: { score: number }[]): string {
  return axes.map((ax, i) => {
    const { x, y } = polar((360 / N) * i, (ax.score / 100) * MAX_R)
    return `${x},${y}`
  }).join(' ')
}

function getAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  return today.getFullYear() - birth.getFullYear()
}

const BADGE_COLORS: [string, string][] = [
  ['#1787A6', '#0d6a84'],
  ['#A7BBFA', '#7b96f7'],
  ['#FCB857', '#e9a040'],
  ['#FF7A59', '#e05e3f'],
  ['#22C55E', '#16a34a'],
]

export default function ChildGrowthScreen() {
  const insets = useSafeAreaInsets()
  const { id, name, dob, imageUrl } = useLocalSearchParams<{
    id: string; name: string; dob: string; imageUrl: string
  }>()

  const { data: progress } = useChildProgress(id)

  const age = dob ? getAge(dob) : null
  const displayName = name ?? 'Your child'

  const axes = useMemo(() => {
    if (!progress) return AXIS_KEYS.map(k => ({ key: k, label: AXIS_LABELS[k]!, score: 0 }))
    return AXIS_KEYS.map(k => ({ key: k, label: AXIS_LABELS[k]!, score: progress.skills[k] ?? 0 }))
  }, [progress])

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../../assets/images/icon.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Back */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <Text style={styles.heroName}>{displayName}'s Growth</Text>
            {age !== null && <Text style={styles.heroAge}>{age} year{age !== 1 ? 's' : ''} old</Text>}
          </View>
        </View>

        {/* ── Radar chart card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skill Radar</Text>
          <Text style={styles.cardSubtitle}>Based on sessions completed</Text>

          <View style={styles.chartWrap}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              {/* Grid rings */}
              {Array.from({ length: LEVELS }, (_, lvl) => {
                const r = (MAX_R / LEVELS) * (lvl + 1)
                return (
                  <Polygon
                    key={lvl}
                    points={ringPoints(r)}
                    fill={lvl === LEVELS - 1 ? colors.mint : 'none'}
                    stroke={colors.border}
                    strokeWidth={1}
                    strokeDasharray={lvl < LEVELS - 1 ? '4,3' : undefined}
                  />
                )
              })}

              {/* Axis lines */}
              {axes.map((_, i) => {
                const end = polar((360 / N) * i, MAX_R)
                return (
                  <Line
                    key={i}
                    x1={CENTER} y1={CENTER}
                    x2={end.x} y2={end.y}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                )
              })}

              {/* Score polygon */}
              <Polygon
                points={makeScorePoints(axes)}
                fill={colors.primary + '33'}
                stroke={colors.primary}
                strokeWidth={2}
              />

              {/* Score dots */}
              {axes.map((ax, i) => {
                const { x, y } = polar((360 / N) * i, (ax.score / 100) * MAX_R)
                return (
                  <Circle key={i} cx={x} cy={y} r={5} fill={colors.primary} />
                )
              })}

              {/* Center dot */}
              <Circle cx={CENTER} cy={CENTER} r={3} fill={colors.primary} />

              {/* Labels */}
              {axes.map((ax, i) => {
                const { x, y } = polar((360 / N) * i, MAX_R + 22)
                const textAnchor = x < CENTER - 4 ? 'end' : x > CENTER + 4 ? 'start' : 'middle'
                return (
                  <SvgText
                    key={i}
                    x={x} y={y + 4}
                    textAnchor={textAnchor}
                    fontSize={10}
                    fontFamily="Nunito-SemiBold"
                    fill={colors.navy}
                  >
                    {ax.label}
                  </SvgText>
                )
              })}
            </Svg>
          </View>

          {/* Score rows */}
          <View style={styles.scoreList}>
            {axes.map((ax, i) => (
              <View key={ax.label} style={styles.scoreRow}>
                <View style={[styles.scoreDot, { backgroundColor: BADGE_COLORS[i][0] }]} />
                <Text style={styles.scoreLabel}>{ax.label}</Text>
                <View style={styles.scoreTrack}>
                  <View style={[styles.scoreFill, { width: `${ax.score}%`, backgroundColor: BADGE_COLORS[i][0] }]} />
                </View>
                <Text style={styles.scoreValue}>{ax.score}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Insights card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insights</Text>

          {[
            { icon: 'trending-up-outline',  color: colors.primary, text: 'Language skills are top-ranked — great storytelling potential!' },
            { icon: 'bulb-outline',          color: '#FCB857',      text: 'Creativity is growing fast — consider adding Art sessions.' },
            { icon: 'fitness-outline',       color: '#A7BBFA',      text: 'Motor skills improve with active play — try Dance or Yoga.' },
          ].map((item, i) => (
            <View key={i} style={styles.insightRow}>
              <View style={[styles.insightIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.insightText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Milestones card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Milestones</Text>
          <View style={styles.milestoneGrid}>
            {[
              { icon: '🎨', label: 'First Art Session' },
              { icon: '🎵', label: '5 Music Classes' },
              { icon: '🏅', label: 'Focus Champion' },
              { icon: '🌟', label: 'Top Performer' },
            ].map(m => (
              <View key={m.label} style={styles.milestoneItem}>
                <Text style={styles.milestoneEmoji}>{m.icon}</Text>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EF' },

  hero: {
    height: 220,
    backgroundColor: colors.navy,
    justifyContent: 'flex-end',
  },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { padding: spacing.md, gap: 4 },
  heroName: { fontSize: fontSize.h1, fontFamily: 'Nunito-Bold', color: colors.white },
  heroAge:  { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.80)' },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle:    { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  cardSubtitle: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray, marginTop: -spacing.sm },

  chartWrap: { alignItems: 'center' },

  // Score rows
  scoreList: { gap: spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreLabel: { width: 90, fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  scoreTrack: { flex: 1, height: 6, backgroundColor: colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 3 },
  scoreValue: { width: 34, fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.navy, textAlign: 'right' },

  // Insights
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  insightIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.navy, lineHeight: 22 },

  // Milestones
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  milestoneItem: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.md * 2 - spacing.md) / 2 - spacing.sm,
    backgroundColor: colors.lightGray,
    borderRadius: radius.button,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  milestoneEmoji: { fontSize: 28 },
  milestoneLabel: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.navy, textAlign: 'center' },
})
