import { View, Text, Animated } from 'react-native'
import { colors, spacing } from '../theme/colors'

interface Message {
  role: 'user' | 'assistant'
  content: string
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
  const isUser = message.role === 'user'
  
  // Ensure content is a safe string
  const safeContent = String(message.content || '').trim()
  
  // Don't render if no content
  if (!safeContent) return null
  
  return (
    <Animated.View 
      style={[
        styles.messageWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.messageContainer}>
        <Text style={[styles.messageRole, isUser ? styles.userRole : styles.claudeRole]}>
          {isUser ? 'You' : 'Claude'}
        </Text>
        <Text style={styles.messageContent}>
          {safeContent}
        </Text>
      </View>
    </Animated.View>
  )
}