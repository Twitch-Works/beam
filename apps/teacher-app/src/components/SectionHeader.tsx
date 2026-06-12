import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSize, fontWeight, spacing } from '../constants/theme'

type SectionHeaderProps = {
  title: string
  action?: string
}

export function SectionHeader({ action, title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.navy,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  action: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
})
