import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { colors, spacing } from '../theme/colors'

interface EmptyStateProps {
  isConnected: boolean
  claudeIsRunning: boolean
  onStartClaude: () => void
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
}

const createEmptyStyles = () => ({
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.text.tertiary,
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignSelf: 'center' as const,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
})

export function EmptyState({ isConnected, claudeIsRunning, onStartClaude, fadeAnim, slideAnim }: EmptyStateProps) {
  const styles = createEmptyStyles()
  
  return (
    <Animated.View 
      style={[
        styles.emptyState,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.emptyTitle}>How can I help you code today?</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation to control Claude Code remotely
      </Text>
      {isConnected && !claudeIsRunning && (
        <TouchableOpacity 
          style={styles.startButton}
          onPress={onStartClaude}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Claude Code</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}