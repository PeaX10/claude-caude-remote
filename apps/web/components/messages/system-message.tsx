import { View, Text } from 'react-native'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'

interface SystemMessageProps {
  content: string
  timestamp?: number
}

export function SystemMessage({ content, timestamp }: SystemMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="info" size={14} color={colors.text.tertiary} />
        <Text style={styles.label}>System</Text>
      </View>
      <Text style={styles.content}>{content}</Text>
      {timestamp && (
        <Text style={styles.timestamp}>
          {new Date(timestamp).toLocaleTimeString()}
        </Text>
      )}
    </View>
  )
}

const styles = {
  container: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: colors.text.tertiary,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
}