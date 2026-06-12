import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button } from './Button'
import { colors, fontSize, fontWeight, spacing } from '../constants/theme'

type StateViewProps = {
  message: string
  cta?: string
  onRetry?: () => void
}

export function LoadingState({ message }: StateViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

export function ErrorState({ message, onRetry }: StateViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something needs a retry</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
    </View>
  )
}

export function EmptyState({ cta, message }: StateViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      {cta ? <Text style={styles.message}>{cta}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.lightGray,
  },
  title: {
    color: colors.navy,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  message: {
    color: colors.gray,
    fontSize: fontSize.body,
    lineHeight: 20,
    textAlign: 'center',
  },
})
