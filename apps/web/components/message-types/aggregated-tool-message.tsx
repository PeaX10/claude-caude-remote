import { View, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing } from '../../theme/colors'
import { LoadingSpinner } from '../shared/loading-spinner'
import { getToolIcon } from '../../constants/tool-constants'

interface NestedTool {
  name: string
  status: 'running' | 'completed' | 'error'
  count: number
}

interface AggregatedToolMessageProps {
  parentTool: string
  nestedTools: NestedTool[]
  isLoading?: boolean
  timestamp: number
}

export function AggregatedToolMessage({
  parentTool,
  nestedTools,
  isLoading = false,
  timestamp
}: AggregatedToolMessageProps) {
  const getStatusIcon = (status: string, toolName: string, count = 1) => {
    switch (status) {
      case 'running':
        return <LoadingSpinner size={12} color={colors.accent.primary} />
      case 'completed':
        return (
          <View style={styles.completedBadge}>
            <Feather 
              name={getToolIcon(toolName) as any}
              size={10} 
              color={colors.semantic.success} 
            />
            {count > 1 && (
              <Text style={styles.countBadge}>{count}</Text>
            )}
          </View>
        )
      case 'error':
        return (
          <View style={styles.errorBadge}>
            <Feather 
              name="x-circle" 
              size={10} 
              color={colors.semantic.error} 
            />
            {count > 1 && (
              <Text style={styles.countBadge}>{count}</Text>
            )}
          </View>
        )
    }
  }

  const totalNested = nestedTools.reduce((sum, tool) => sum + tool.count, 0)
  const runningCount = nestedTools.filter(tool => tool.status === 'running').length

  return (
    <View style={styles.container}>
      {/* Parent tool header */}
      <View style={styles.headerContainer}>
        <View style={styles.parentTool}>
          <Feather 
            name={getToolIcon(parentTool) as any}
            size={16} 
            color={colors.text.primary} 
          />
          <Text style={styles.parentToolName}>{parentTool}</Text>
          {isLoading && (
            <LoadingSpinner size={12} color={colors.accent.primary} />
          )}
        </View>
        <Text style={styles.nestedCount}>
          +{totalNested} nested tools
        </Text>
      </View>

      {/* Nested tools display */}
      <View style={styles.nestedContainer}>
        <View style={styles.connectionLine} />
        <View style={styles.nestedToolsList}>
          {nestedTools.map((tool, index) => (
            <View key={`${tool.name}-${index}`} style={styles.nestedToolItem}>
              <View style={styles.connectionDot} />
              {getStatusIcon(tool.status, tool.name, tool.count)}
              <Text style={[
                styles.nestedToolName,
                tool.status === 'error' && styles.errorText
              ]}>
                {tool.name}
              </Text>
              {tool.count > 1 && (
                <Text style={styles.multipleLabel}>×{tool.count}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Summary info */}
      {runningCount > 0 && (
        <View style={styles.summaryContainer}>
          <LoadingSpinner size={10} color={colors.accent.primary} />
          <Text style={styles.summaryText}>
            {runningCount} tools running
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = {
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.primary,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  parentTool: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  parentToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    fontFamily: 'monospace',
  },
  nestedCount: {
    fontSize: 11,
    color: colors.accent.primary,
    fontWeight: '500' as const,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  nestedContainer: {
    position: 'relative' as const,
    marginLeft: 8,
  },
  connectionLine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border.primary,
    borderRadius: 1,
  },
  nestedToolsList: {
    marginLeft: 16,
  },
  nestedToolItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
    position: 'relative' as const,
  },
  connectionDot: {
    position: 'absolute' as const,
    left: -24,
    top: '50%' as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.primary,
    marginTop: -3,
  },
  nestedToolName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontFamily: 'monospace',
    flex: 1,
  },
  multipleLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500' as const,
    marginLeft: spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  errorBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  countBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    fontSize: 8,
    color: colors.text.inverse,
    backgroundColor: colors.accent.primary,
    borderRadius: 6,
    width: 12,
    height: 12,
    textAlign: 'center' as const,
    lineHeight: 12,
    fontWeight: '600' as const,
  },
  errorText: {
    color: colors.semantic.error,
  },
  summaryContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
  },
  summaryText: {
    fontSize: 11,
    color: colors.accent.primary,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
}