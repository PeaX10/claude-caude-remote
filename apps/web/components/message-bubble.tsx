import { View, Text, Animated } from 'react-native'
import { colors, spacing } from '../theme/colors'

interface Message {
  id: string
  type: 'user' | 'claude' | 'system'
  content: string
  timestamp: number
}

interface MessageBubbleProps {
  message: Message
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
}

const createMessageStyles = () => ({
  messageWrapper: {
    marginBottom: spacing.xl,
  },
  messageContainer: {
    gap: spacing.sm,
  },
  messageRole: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  userRole: {
    color: colors.text.secondary,
  },
  claudeRole: {
    color: colors.text.accent,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
    fontWeight: '400' as const,
  },
})

export function MessageBubble({ message, fadeAnim, slideAnim }: MessageBubbleProps) {
  const styles = createMessageStyles()
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  
  return (
    <Animated.View 
      style={[
        styles.messageWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.messageContainer}>
        <Text style={[styles.messageRole, isUser ? styles.userRole : styles.claudeRole]}>
          {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
        </Text>
        <Text style={styles.messageContent}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  )
}