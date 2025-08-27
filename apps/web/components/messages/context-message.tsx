import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { colors, spacing } from '../../theme/colors'
import { Feather } from '@expo/vector-icons'

interface ContextMessageProps {
  context?: {
    type?: string
    content?: string
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
  }
  timestamp?: number
}

export function ContextMessage({ context, timestamp }: ContextMessageProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (!context) return null
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerContent}>
          <Feather name="database" size={14} color={colors.text.accent} />
          <Text style={styles.label}>Context</Text>
          {context.type && (
            <Text style={styles.type}>{context.type}</Text>
          )}
        </View>
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <>
          {context.content && (
            <Text style={styles.content} numberOfLines={10}>
              {context.content}
            </Text>
          )}
          
          {context.usage && (
            <View style={styles.usage}>
              <Text style={styles.usageLabel}>Token Usage:</Text>
              <Text style={styles.usageItem}>
                Input: {context.usage.input_tokens || 0}
              </Text>
              <Text style={styles.usageItem}>
                Output: {context.usage.output_tokens || 0}
              </Text>
              {context.usage.cache_creation_input_tokens > 0 && (
                <Text style={styles.usageItem}>
                  Cache Creation: {context.usage.cache_creation_input_tokens}
                </Text>
              )}
              {context.usage.cache_read_input_tokens > 0 && (
                <Text style={styles.usageItem}>
                  Cache Read: {context.usage.cache_read_input_tokens}
                </Text>
              )}
            </View>
          )}
        </>
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
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.secondary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.accent,
    textTransform: 'uppercase' as const,
  },
  type: {
    fontSize: 11,
    color: colors.text.secondary,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  content: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontFamily: 'monospace',
  },
  usage: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
  },
  usageLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  usageItem: {
    fontSize: 11,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
}