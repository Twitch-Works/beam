import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

interface EmptyStateProps {
  title: string
  subtitle?: string
  image?: ImageSource
  action?: { label: string; onPress: () => void }
}

const DEFAULT_IMAGE = require('../../assets/images/empty.png')

export function EmptyState({ title, subtitle, image, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Image
        source={image ?? DEFAULT_IMAGE}
        style={styles.image}
        contentFit="contain"
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.8}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.h3,
    fontFamily: 'Nunito-Bold',
    fontWeight: fontWeight.bold,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.gray,
    textAlign: 'center',
    maxWidth: 260,
  },
  actionText: {
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginTop: spacing.xs,
  },
})
