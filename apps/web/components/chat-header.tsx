import { View, Text, TouchableOpacity } from 'react-native'
import { colors, spacing } from '../theme/colors'
import { BurgerMenu } from './burger-menu'

interface ChatHeaderProps {
  contextPercent: number | null
  isConnected: boolean
  claudeIsRunning: boolean
  onRefresh: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
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
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  menuButton: {
    marginRight: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  menuIconContainer: {
    width: 24,
    height: 16,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  menuIconBar: {
    width: 20,
    height: 2,
    backgroundColor: colors.text.primary,
    borderRadius: 1,
  },
  menuIconBarTop: {
    width: 20,
  },
  menuIconBarMiddle: {
    width: 20,
  },
  menuIconBarBottom: {
    width: 20,
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
    marginRight: spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  refreshIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
    fontWeight: '300' as const,
  },
  statusIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

export function ChatHeader({ contextPercent, isConnected, claudeIsRunning, onRefresh, onToggleSidebar, sidebarOpen }: ChatHeaderProps) {
  const styles = createHeaderStyles()
  
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <BurgerMenu isOpen={sidebarOpen} onPress={onToggleSidebar} />
        <Text style={styles.headerTitle}>Claude Code</Text>
      </View>
      <View style={styles.headerActions}>
        {contextPercent !== null && claudeIsRunning && (
          <Text style={[
            styles.contextIndicator, 
            { 
              color: getContextColor(contextPercent),
              fontWeight: getContextWeight(contextPercent) as any
            }
          ]}>
            {`${contextPercent}%`}
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
                : colors.accent.primary,
            opacity: !isConnected ? 0.5 : 1
          }]} />
        </View>
      </View>
    </View>
  )
}