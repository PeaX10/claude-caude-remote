import { View, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing } from '../../theme/colors'
import { LoadingSpinner } from './loading-spinner'
import { ToolExecution } from '../../hooks/use-tool-tracker'
import { getToolIcon } from '../../constants/tool-constants'

interface ToolTrackerDisplayProps {
  totalTools: number
  runningCount: number
  lastThreeTools: ToolExecution[]
  showCollapsed?: boolean
}

export function ToolTrackerDisplay({
  totalTools,
  runningCount,
  lastThreeTools,
  showCollapsed = false
}: ToolTrackerDisplayProps) {
  if (totalTools === 0) return null

  const getStatusIcon = (status: ToolExecution['status'], toolName: string) => {
    switch (status) {
      case 'running':
        return <LoadingSpinner size={10} color={colors.accent.primary} />
      case 'completed':
        return (
          <Feather 
            name={getToolIcon(toolName) as any}
            size={10} 
            color={colors.semantic.success} 
          />
        )
      case 'error':
        return (
          <Feather 
            name="x-circle" 
            size={10} 
            color={colors.semantic.error} 
          />
        )
    }
  }

  // Collapsed view for floating display
  if (showCollapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <View style={styles.collapsedContent}>
          <Text style={styles.collapsedCount}>{totalTools}</Text>
          {runningCount > 0 && (
            <LoadingSpinner size={12} color={colors.accent.primary} />
          )}
        </View>
        {lastThreeTools.slice(0, 3).map((tool, index) => (
          <View key={`${tool.id}-${index}`} style={styles.collapsedTool}>
            {getStatusIcon(tool.status, tool.name)}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.counterSection}>
        <Text style={styles.toolCount}>
          +{totalTools} more tool uses
        </Text>
        {runningCount > 0 && (
          <View style={styles.runningIndicator}>
            <LoadingSpinner size={8} color={colors.accent.primary} />
            <Text style={styles.runningText}>
              {runningCount} running
            </Text>
          </View>
        )}
      </View>

      {lastThreeTools.length > 0 && (
        <View style={styles.recentToolsSection}>
          {lastThreeTools.map((tool, index) => (
            <View key={`${tool.id}-${index}`} style={styles.toolItem}>
              {getStatusIcon(tool.status, tool.name)}
              <Text style={[
                styles.toolName,
                tool.status === 'error' && styles.errorText
              ]}>
                {tool.name}
              </Text>
              {index === 0 && (
                <Text style={styles.recentLabel}>latest</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = {
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  counterSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  toolCount: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600' as const,
    flex: 1,
  },
  runningIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  runningText: {
    fontSize: 10,
    color: colors.accent.primary,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  recentToolsSection: {
    gap: 4,
  },
  toolItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 2,
  },
  toolName: {
    fontSize: 11,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontFamily: 'monospace',
    flex: 1,
  },
  errorText: {
    color: colors.semantic.error,
  },
  recentLabel: {
    fontSize: 9,
    color: colors.accent.primary,
    fontWeight: '500' as const,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    textTransform: 'uppercase' as const,
  },
  // Collapsed styles for compact display
  collapsedContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.primary,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  collapsedContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: spacing.xs,
  },
  collapsedCount: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600' as const,
    marginRight: 4,
  },
  collapsedTool: {
    marginLeft: 2,
  },
}