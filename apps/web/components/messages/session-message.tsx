import { View, Text } from 'react-native'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'

interface SessionMessageProps {
  session?: {
    id?: string
    created?: string
    updated?: string
    cwd?: string
  }
  timestamp?: number
}

export function SessionMessage({ session, timestamp }: SessionMessageProps) {
  if (!session) return null
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="terminal" size={14} color={colors.accent.primary} />
        <Text style={styles.label}>Session Info</Text>
      </View>
      
      {session.id && (
        <View style={styles.item}>
          <Text style={styles.itemLabel}>ID:</Text>
          <Text style={styles.itemValue}>{session.id}</Text>
        </View>
      )}
      
      {session.cwd && (
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Directory:</Text>
          <Text style={styles.itemValue}>{session.cwd}</Text>
        </View>
      )}
      
      {session.created && (
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Created:</Text>
          <Text style={styles.itemValue}>
            {new Date(session.created).toLocaleString()}
          </Text>
        </View>
      )}
      
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
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent.primary,
    textTransform: 'uppercase' as const,
  },
  item: {
    flexDirection: 'row' as const,
    marginBottom: spacing.xs,
  },
  itemLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    width: 80,
    fontWeight: '500' as const,
  },
  itemValue: {
    fontSize: 12,
    color: colors.text.primary,
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
}