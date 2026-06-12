import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize } from '@/constants/theme'
import type { Child } from '@/lib/api'

interface ChildSelectorProps {
  children: Child[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ChildSelector({ children, selectedId, onSelect }: ChildSelectorProps) {
  const activeId = selectedId ?? children[0]?.id

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {children.map((child, idx) => {
        const isActive = activeId === child.id
        return (
          <TouchableOpacity
            key={child.id}
            style={styles.item}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onSelect(child.id)
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarRing, isActive && styles.avatarRingActive]}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {child.firstName[0]?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
              {child.firstName}
            </Text>
          </TouchableOpacity>
        )
      })}

      {/* Add child button */}
      <TouchableOpacity
        style={styles.item}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          router.push('/(auth)/child-setup')
        }}
        activeOpacity={0.8}
      >
        <View style={styles.addRing}>
          <Ionicons name="add" size={22} color={colors.gray} />
        </View>
        <Text style={styles.addLabel}>Add</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const RING_SIZE = 68
const INNER_SIZE = 60

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.lg,
  },
  item: { alignItems: 'center', gap: spacing.sm, minWidth: RING_SIZE },

  avatarRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
  avatarRingActive: {
    borderColor: colors.primary,
  },
  avatarInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },

  name: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
    textAlign: 'center',
  },
  nameActive: { color: colors.primary, fontFamily: 'Nunito-Bold' },

  addRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  addLabel: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-SemiBold',
    color: colors.gray,
    textAlign: 'center',
  },
})
