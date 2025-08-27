import { View } from 'react-native'
import { colors, spacing } from '../../theme/colors'
import { MarkdownRenderer } from '../markdown-renderer'

interface AssistantMessageProps {
  content: string
  timestamp?: number
  isStreaming?: boolean
  status?: 'thinking' | 'processing' | 'complete'
}

export function AssistantMessage({ 
  content, 
  timestamp, 
  isStreaming,
  status = 'complete'
}: AssistantMessageProps) {
  
  return (
    <View style={styles.container}>
      <View style={styles.messageWrapper}>
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <View style={styles.streamingDot} />
          </View>
        )}
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
    paddingLeft: spacing.sm,
  },
  streamingIndicator: {
    marginTop: spacing.xs,
  },
  streamingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
}