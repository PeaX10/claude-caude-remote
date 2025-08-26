import { View, Text, TouchableOpacity } from 'react-native'
import { colors, spacing } from '../theme/colors'

interface ChatHeaderProps {
  contextPercent: number | null
  isConnected: boolean
  claudeIsRunning: boolean
  onRefresh: () => void
}

function getContextColor(percent: number) {
  if (percent <= 10) return colors.semantic.error
  if (percent <= 25) return '#FF8C00'
  if (percent <= 50) return colors.semantic.warning
  return colors.text.tertiary
}

function getContextWeight(percent: number) {
  if (percent <= 25) return '600'
  return '500'
}

const createHeaderStyles = () => ({
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  contextIndicator: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginRight: spacing.sm,
  },
  refreshButton: {
    marginRight: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  refreshIcon: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600' as const,
  },
  statusIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
})

export function ChatHeader({ contextPercent, isConnected, claudeIsRunning, onRefresh }: ChatHeaderProps) {
  const styles = createHeaderStyles()
  
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Claude Code</Text>
      <View style={styles.headerActions}>
        {contextPercent !== null && claudeIsRunning && (
          <Text style={[
            styles.contextIndicator, 
            { 
              color: getContextColor(contextPercent),
              fontWeight: getContextWeight(contextPercent) as any
            }
          ]}>
            {contextPercent}%
          </Text>
        )}
        {isConnected && claudeIsRunning && (
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        )}
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { 
            backgroundColor: !isConnected 
              ? colors.text.tertiary 
              : claudeIsRunning 
                ? colors.semantic.success 
                : colors.accent.secondary
          }]} />
          <Text style={styles.statusText}>
            {!isConnected ? 'Offline' : claudeIsRunning ? 'Ready' : 'Connected'}
          </Text>
        </View>
      </View>
    </View>
  )
}