import { View, Text, TouchableOpacity } from 'react-native'
import { colors, spacing } from '../../theme/colors'
import { useState } from 'react'
import { Feather } from '@expo/vector-icons'

interface UserMessageProps {
  content: string
  timestamp?: number
}

export function UserMessage({ content }: UserMessageProps) {
  const lines = content.split('\n')
  const hasMoreThan5Lines = lines.length > 5
  const [expanded, setExpanded] = useState(false)
  
  const displayContent = expanded || !hasMoreThan5Lines 
    ? content 
    : lines.slice(0, 5).join('\n') + '...'
  
  return (
    <View style={styles.container}>
      <View style={styles.messageWrapper}>
        <View style={styles.bubble}>
          <Text style={styles.content}>{displayContent}</Text>
          {hasMoreThan5Lines && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Feather 
                name={expanded ? 'chevron-up' : 'chevron-down'} 
                size={14} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = {
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  messageWrapper: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  bubble: {
    maxWidth: '85%',
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    borderTopRightRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  expandButton: {
    alignSelf: 'center' as const,
    marginTop: spacing.xs,
  },
}