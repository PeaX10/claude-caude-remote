import { View, Text } from 'react-native'
import { colors, spacing } from '../theme/colors'

const createTypingStyles = () => ({
  typingContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  typingText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  typingDots: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.tertiary,
  },
})

export function TypingIndicator() {
  const styles = createTypingStyles()
  
  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>CLAUDE</Text>
      <View style={styles.typingDots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  )
}