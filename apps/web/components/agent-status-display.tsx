import { View, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing } from '../theme/colors'
import { LoadingSpinner } from './shared/loading-spinner'
import { ShimmerText } from './shared/shimmer-text'
import { ToolExecution } from '../hooks/use-tool-tracker'
import { FeatherIconName } from '../types/icon.types'

interface AgentStatusDisplayProps {
  activeAgents: ToolExecution[]
  completedAgents: ToolExecution[]
  agentToolCounts: Record<string, number>
  getAgentToolIds?: (agentId: string) => string[]
}

const formatDuration = (duration: number) => {
  if (!duration || duration <= 0) return '0s'
  
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

const formatTokens = (tokens: number) => {
  if (!tokens || tokens <= 0) return '0'
  
  if (tokens >= 1000000) {
    const millions = Math.round(tokens / 1000000)
    return `${millions}M`
  }
  if (tokens >= 1000) {
    const thousands = Math.round(tokens / 1000)
    return `${thousands}k`
  }
  return tokens.toString()
}

const getAgentIcon = (agentType: string): FeatherIconName => {
  const iconMap: Record<string, string> = {
    'general-purpose': 'cpu',
    'python-expert': 'code',
    'system-architect': 'layers',
    'refactoring-expert': 'refresh-cw',
    'devops-architect': 'server',
    'learning-guide': 'book',
    'security-engineer': 'shield',
    'frontend-architect': 'monitor',
    'quality-engineer': 'check-circle',
    'root-cause-analyst': 'search',
    'socratic-mentor': 'help-circle',
    'performance-engineer': 'zap',
    'requirements-analyst': 'clipboard',
    'backend-architect': 'database',
    'technical-writer': 'edit-3',
    'code-quality-enforcer': 'award',
    'statusline-setup': 'settings',
    'output-style-setup': 'palette'
  }
  
  return (iconMap[agentType] || 'tool') as FeatherIconName
}

const getAgentDisplayName = (agentType: string) => {
  const nameMap: Record<string, string> = {
    'general-purpose': 'General Purpose',
    'python-expert': 'Python Expert',
    'system-architect': 'System Architect',
    'refactoring-expert': 'Refactoring Expert',
    'devops-architect': 'DevOps Architect',
    'learning-guide': 'Learning Guide',
    'security-engineer': 'Security Engineer',
    'frontend-architect': 'Frontend Architect',
    'quality-engineer': 'Quality Engineer',
    'root-cause-analyst': 'Root Cause Analyst',
    'socratic-mentor': 'Socratic Mentor',
    'performance-engineer': 'Performance Engineer',
    'requirements-analyst': 'Requirements Analyst',
    'backend-architect': 'Backend Architect',
    'technical-writer': 'Technical Writer',
    'code-quality-enforcer': 'Code Quality Enforcer',
    'statusline-setup': 'Status Line Setup',
    'output-style-setup': 'Output Style Setup'
  }
  
  return nameMap[agentType] || agentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatAgentStats = (agent: ToolExecution) => {
  const parts = ['Done']
  
  if (agent.toolCount) {
    parts.push(`${agent.toolCount} tool uses`)
  } else {
    parts.push('completed')
  }
  
  if (agent.tokenCount) {
    parts.push(`${formatTokens(agent.tokenCount)} tokens`)
  }
  
  if (agent.duration) {
    parts.push(`${formatDuration(agent.duration)}`)
  }
  
  return `(${parts.join(' | ')})`
}

export function AgentStatusDisplay({ activeAgents, completedAgents, agentToolCounts, getAgentToolIds }: AgentStatusDisplayProps) {
  if (activeAgents.length === 0 && completedAgents.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      {/* Active agents */}
      {activeAgents.map(agent => {
        const currentToolCount = agentToolCounts[agent.id] || 0
        return (
          <View key={agent.id} style={styles.agentItem}>
            <View style={styles.agentHeader}>
              <View style={styles.agentIconContainer}>
                <Feather 
                  name={getAgentIcon(agent.agentType)} 
                  size={14} 
                  color={colors.accent.primary} 
                />
                <LoadingSpinner size={10} color={colors.accent.primary} style={styles.agentSpinner} />
              </View>
              <View style={styles.agentInfo}>
                <ShimmerText 
                  style={styles.agentType}
                  isActive={true}
                >
                  {getAgentDisplayName(agent.agentType || '')}
                </ShimmerText>
                <Text style={styles.agentId} numberOfLines={1}>
                  {agent.agentType || ''}
                </Text>
              </View>
            </View>
            <Text style={styles.agentDescription} numberOfLines={1}>
              {agent.description || ''}
            </Text>
            {currentToolCount > 0 && (
              <View style={styles.liveToolCount}>
                <Text style={styles.liveToolText}>
                  {currentToolCount} tool{currentToolCount > 1 ? 's' : ''} executed
                </Text>
              </View>
            )}
          </View>
        )
      })}

      {/* Recently completed agents */}
      {completedAgents.slice(0, 2).map(agent => (
        <View key={agent.id} style={styles.completedAgentItem}>
          <View style={styles.completedAgentHeader}>
            <View style={styles.completedAgentIconContainer}>
              <Feather 
                name={getAgentIcon(agent.agentType)} 
                size={12} 
                color={colors.text.secondary} 
              />
              <Feather 
                name={agent.status === 'error' ? 'x-circle' : 'check-circle'} 
                size={10} 
                color={agent.status === 'error' ? colors.semantic.error : colors.semantic.success} 
                style={styles.completedStatusIcon}
              />
            </View>
            <View style={styles.completedAgentInfo}>
              <Text style={styles.completedAgentType}>{getAgentDisplayName(agent.agentType || '')}</Text>
              <Text style={styles.completedAgentId}>{agent.agentType || ''}</Text>
            </View>
          </View>
          <Text style={styles.completedAgentDescription} numberOfLines={1}>
            {agent.description || ''}
          </Text>
          <View style={styles.agentStats}>
            <Text style={styles.statText}>
              {formatAgentStats(agent)}
            </Text>
            {getAgentToolIds && (
              <Text style={styles.aggregationText}>
                Aggregated {getAgentToolIds(agent.id).length} tool messages
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = {
  container: {
    gap: spacing.xs,
  },
  agentItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  agentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  agentIconContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: spacing.xs,
    position: 'relative' as const,
  },
  agentSpinner: {
    position: 'absolute' as const,
    right: -6,
    top: -6,
  },
  agentInfo: {
    flex: 1,
  },
  agentType: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  agentId: {
    fontSize: 9,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  agentDescription: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic' as const,
  },
  completedAgentItem: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.success,
    opacity: 0.8,
  },
  completedAgentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  completedAgentIconContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: spacing.xs,
    position: 'relative' as const,
  },
  completedStatusIcon: {
    position: 'absolute' as const,
    right: -6,
    top: -6,
  },
  completedAgentInfo: {
    flex: 1,
  },
  completedAgentType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  completedAgentId: {
    fontSize: 8,
    color: colors.text.quaternary,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  completedAgentDescription: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic' as const,
    marginBottom: 4,
  },
  agentStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
    paddingTop: 4,
  },
  statText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  liveToolCount: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.tertiary,
  },
  liveToolText: {
    fontSize: 10,
    color: colors.accent.primary,
    fontWeight: '500' as const,
    fontFamily: 'monospace',
  },
  aggregationText: {
    fontSize: 9,
    color: colors.text.quaternary,
    fontStyle: 'italic' as const,
    marginTop: 2,
    fontFamily: 'monospace',
  },
}